import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./ai";
import { getDb, newId } from "./db";
import type { SeoAudit, SeoCheck, Workspace } from "./types";

// SEO Studio: fetch a page, run a heuristic audit (no dependencies — regex
// parsing), then let Claude write prioritized recommendations and rewritten
// title/description. Falls back to the heuristics alone without an API key.

export interface PageFacts {
  url: string;
  title: string;
  metaDescription: string;
  canonical: string;
  h1s: string[];
  h2Count: number;
  imgCount: number;
  imgMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  hasOgTags: boolean;
  hasViewport: boolean;
  firstParagraph: string;
}

export async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "KayCreatesWeb-SEO-Audit/1.0 (+https://kaycreatesweb.com)" },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`The page returned HTTP ${res.status}.`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("html")) throw new Error("That URL doesn't serve an HTML page.");
  return await res.text();
}

export function parsePage(html: string, url: string): PageFacts {
  const grab = (re: RegExp): string => decodeEntities((html.match(re)?.[1] ?? "").trim());
  const all = (re: RegExp): string[] => {
    const out: string[] = [];
    for (const m of html.matchAll(re)) out.push(decodeEntities(stripTags(m[1]).trim()));
    return out;
  };

  const meta = (name: string): string =>
    grab(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i")) ||
    grab(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, "i"));

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const text = stripTags(body).replace(/\s+/g, " ").trim();

  const imgs = body.match(/<img\b[^>]*>/gi) ?? [];
  const imgMissingAlt = imgs.filter((tag) => !/alt=["'][^"']+["']/i.test(tag)).length;

  let host = "";
  try {
    host = new URL(url).host;
  } catch {}
  const hrefs = Array.from(body.matchAll(/<a\b[^>]*href=["']([^"'#][^"']*)["']/gi), (m) => m[1]);
  const external = hrefs.filter((h) => /^https?:\/\//i.test(h) && (!host || !h.includes(host)));

  return {
    url,
    title: grab(/<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: meta("description"),
    canonical: grab(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    h1s: all(/<h1[^>]*>([\s\S]*?)<\/h1>/gi),
    h2Count: (body.match(/<h2[\b\s>]/gi) ?? []).length,
    imgCount: imgs.length,
    imgMissingAlt,
    internalLinks: hrefs.length - external.length,
    externalLinks: external.length,
    wordCount: text ? text.split(" ").length : 0,
    hasOgTags: /<meta[^>]+property=["']og:/i.test(html),
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    firstParagraph: text.slice(0, 400),
  };
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// --- Checks & scoring -------------------------------------------------------

export function runChecks(f: PageFacts): { checks: SeoCheck[]; score: number } {
  const checks: SeoCheck[] = [];
  const add = (id: string, label: string, status: SeoCheck["status"], detail: string) =>
    checks.push({ id, label, status, detail });

  if (!f.title) add("title", "Title tag", "fail", "The page has no <title>. This is the single most important on-page element.");
  else if (f.title.length < 30 || f.title.length > 60)
    add("title", "Title tag", "warn", `"${f.title}" is ${f.title.length} characters — aim for 30–60 so it doesn't truncate in results.`);
  else add("title", "Title tag", "pass", `"${f.title}" (${f.title.length} chars) is a good length.`);

  if (!f.metaDescription)
    add("description", "Meta description", "fail", "Missing. Search engines will improvise a snippet — write one that sells the click.");
  else if (f.metaDescription.length < 70 || f.metaDescription.length > 160)
    add("description", "Meta description", "warn", `${f.metaDescription.length} characters — aim for 70–160.`);
  else add("description", "Meta description", "pass", `${f.metaDescription.length} characters — good length.`);

  if (f.h1s.length === 0) add("h1", "H1 heading", "fail", "No H1 found. Every page needs exactly one clear H1.");
  else if (f.h1s.length > 1) add("h1", "H1 heading", "warn", `${f.h1s.length} H1s found — keep exactly one and demote the rest.`);
  else add("h1", "H1 heading", "pass", `One H1: "${f.h1s[0].slice(0, 70)}".`);

  if (f.h2Count === 0 && f.wordCount > 300)
    add("structure", "Heading structure", "warn", "No H2 subheadings — break long content into scannable sections.");
  else add("structure", "Heading structure", "pass", `${f.h2Count} H2 subheading${f.h2Count === 1 ? "" : "s"} found.`);

  if (f.wordCount < 150) add("content", "Content depth", "fail", `Only ~${f.wordCount} words of visible text — thin pages rarely rank.`);
  else if (f.wordCount < 300) add("content", "Content depth", "warn", `~${f.wordCount} words — competitive pages usually run 300+.`);
  else add("content", "Content depth", "pass", `~${f.wordCount} words of visible text.`);

  if (f.imgCount > 0 && f.imgMissingAlt > 0)
    add("alt", "Image alt text", "warn", `${f.imgMissingAlt} of ${f.imgCount} images missing alt text — hurts accessibility and image search.`);
  else add("alt", "Image alt text", "pass", f.imgCount === 0 ? "No images on the page." : `All ${f.imgCount} images have alt text.`);

  if (!f.canonical) add("canonical", "Canonical URL", "warn", "No canonical link — add one to avoid duplicate-content dilution.");
  else add("canonical", "Canonical URL", "pass", "Canonical link present.");

  if (!f.hasOgTags) add("og", "Social preview (Open Graph)", "warn", "No og: tags — links shared on social will look bare.");
  else add("og", "Social preview (Open Graph)", "pass", "Open Graph tags present.");

  if (!f.hasViewport) add("viewport", "Mobile viewport", "fail", "No viewport meta tag — the page will render poorly on phones, and mobile-friendliness is a ranking factor.");
  else add("viewport", "Mobile viewport", "pass", "Viewport meta tag present.");

  if (f.internalLinks < 3) add("links", "Internal linking", "warn", `Only ${f.internalLinks} internal links — link related pages to spread authority.`);
  else add("links", "Internal linking", "pass", `${f.internalLinks} internal links found.`);

  const weights: Record<SeoCheck["status"], number> = { pass: 1, warn: 0.5, fail: 0 };
  const score = Math.round((checks.reduce((s, c) => s + weights[c.status], 0) / checks.length) * 100);
  return { checks, score };
}

// --- AI layer -----------------------------------------------------------------

export async function auditPage(workspace: Workspace, url: string): Promise<SeoAudit> {
  const html = await fetchPage(url);
  const facts = parsePage(html, url);
  const { checks, score } = runChecks(facts);

  let recommendations: string[] = [];
  let suggestedTitle = "";
  let suggestedDescription = "";
  let mode: "live" | "fallback" = "fallback";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const ai = await aiRecommendations(workspace, facts, checks);
      recommendations = ai.recommendations;
      suggestedTitle = ai.suggestedTitle;
      suggestedDescription = ai.suggestedDescription;
      mode = "live";
    } catch {
      // fall through to heuristics
    }
  }
  if (recommendations.length === 0) {
    recommendations = checks
      .filter((c) => c.status !== "pass")
      .sort((a, b) => (a.status === "fail" ? -1 : 1) - (b.status === "fail" ? -1 : 1))
      .map((c) => `${c.label}: ${c.detail}`);
    if (recommendations.length === 0) recommendations = ["Strong page — keep content fresh and build internal links to it."];
  }

  const audit: SeoAudit = {
    id: newId("seo"),
    workspaceId: workspace.id,
    url,
    score,
    checks,
    recommendations,
    suggestedTitle,
    suggestedDescription,
    mode,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO seo_audits (id, workspaceId, url, score, checks, recommendations, suggestedTitle, suggestedDescription, mode, createdAt)
       VALUES (@id, @workspaceId, @url, @score, @checks, @recommendations, @suggestedTitle, @suggestedDescription, @mode, @createdAt)`,
    )
    .run({
      ...audit,
      checks: JSON.stringify(audit.checks),
      recommendations: JSON.stringify(audit.recommendations),
    });
  return audit;
}

async function aiRecommendations(workspace: Workspace, facts: PageFacts, checks: SeoCheck[]) {
  const client = new Anthropic();
  const failing = checks.filter((c) => c.status !== "pass").map((c) => `- ${c.label} [${c.status}]: ${c.detail}`).join("\n");

  const prompt = `You are an SEO consultant. A business called ${workspace.name}${
    workspace.about ? ` (${workspace.about.slice(0, 200)})` : ""
  } audited this page:

URL: ${facts.url}
Current title: ${facts.title || "(none)"}
Current meta description: ${facts.metaDescription || "(none)"}
H1: ${facts.h1s[0] ?? "(none)"}
Word count: ~${facts.wordCount}
Opening text: ${facts.firstParagraph || "(none)"}

Issues found:
${failing || "(none — the page passes the basic checks)"}

Reply as strict JSON, no markdown:
{"recommendations": ["<3-6 prioritized, concrete actions — most impactful first, each one sentence, specific to THIS page>"],
 "suggestedTitle": "<a rewritten 30-60 char title that would rank and get clicks>",
 "suggestedDescription": "<a rewritten 70-155 char meta description that sells the click>"}`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    recommendations?: unknown;
    suggestedTitle?: unknown;
    suggestedDescription?: unknown;
  };
  return {
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((r): r is string => typeof r === "string")
      : [],
    suggestedTitle: typeof parsed.suggestedTitle === "string" ? parsed.suggestedTitle : "",
    suggestedDescription:
      typeof parsed.suggestedDescription === "string" ? parsed.suggestedDescription : "",
  };
}

export function listAudits(workspaceId: string, limit = 10): SeoAudit[] {
  const rows = getDb()
    .prepare(`SELECT * FROM seo_audits WHERE workspaceId = ? ORDER BY createdAt DESC LIMIT ?`)
    .all(workspaceId, limit) as (Omit<SeoAudit, "checks" | "recommendations"> & {
    checks: string;
    recommendations: string;
  })[];
  return rows.map((r) => ({
    ...r,
    checks: safeArr(r.checks) as SeoCheck[],
    recommendations: safeArr(r.recommendations) as string[],
  }));
}

function safeArr(s: string): unknown[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
