import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "./ai";
import { dailySeries, listLeads, workspaceStats } from "./convos";
import { listAudits } from "./seo";
import type { Briefing, Workspace } from "./types";

// The AI pulse briefing: a Claude-written summary of how the website's bots
// and SEO are performing — what's working, who to follow up with, what to fix.
// Cached per workspace per day; degrades to a deterministic version without a key.

const g = globalThis as unknown as { __kcwBriefings?: Map<string, Briefing> };

function cache(): Map<string, Briefing> {
  if (!g.__kcwBriefings) g.__kcwBriefings = new Map();
  return g.__kcwBriefings;
}

async function snapshot(workspace: Workspace) {
  const [stats, last7Days, leads, audits] = await Promise.all([
    workspaceStats(workspace.id),
    dailySeries(workspace.id, 7),
    listLeads(workspace.id),
    listAudits(workspace.id, 1),
  ]);
  return {
    stats,
    last7Days,
    newLeads: leads.filter((l) => l.status === "new").slice(0, 10),
    latestAudit: audits[0] ?? null,
  };
}

export async function getBriefing(workspace: Workspace, refresh = false): Promise<Briefing> {
  const key = `${workspace.id}:${new Date().toISOString().slice(0, 10)}`;
  if (!refresh) {
    const hit = cache().get(key);
    if (hit) return hit;
  }

  const snap = await snapshot(workspace);
  const briefing = process.env.ANTHROPIC_API_KEY
    ? await liveBriefing(workspace, snap).catch(() => fallbackBriefing(snap))
    : fallbackBriefing(snap);

  cache().set(key, briefing);
  return briefing;
}

async function liveBriefing(workspace: Workspace, snap: Awaited<ReturnType<typeof snapshot>>): Promise<Briefing> {
  const client = new Anthropic();
  const model = await getModel(client);
  const volume = snap.last7Days.map((d) => `${d.day}: ${d.conversations} chats, ${d.leads} leads`).join("; ");
  const leads = snap.newLeads
    .map((l) => `- ${l.name} <${l.email}> · "${l.message.slice(0, 90)}" · ${l.createdAt.slice(0, 10)}`)
    .join("\n");

  const prompt = `You write the weekly pulse for ${workspace.name}${
    workspace.website ? ` (${workspace.website})` : ""
  }, a business using NovaWebStudio's AI website chatbot + SEO tools.

Data:
- Totals: ${snap.stats.conversations} chatbot conversations, ${snap.stats.messages} messages, ${snap.stats.leads} leads captured (${snap.stats.newLeads} not yet contacted).
- Last 7 days: ${volume}
- Uncontacted leads:
${leads || "(none)"}
- Latest SEO audit: ${
    snap.latestAudit
      ? `${snap.latestAudit.url} scored ${snap.latestAudit.score}/100 on ${snap.latestAudit.createdAt.slice(0, 10)}`
      : "none run yet"
  }

Write it as strict JSON (no markdown):
{"headline": "<one energetic sentence on how the website is performing>",
 "highlights": ["<2-4 short observations grounded in the data — trends, notable leads, wins>"],
 "actions": ["<2-3 concrete next steps, most valuable first — name specific leads to contact, pages to fix>"]}

Be specific with names and numbers from the data. Never invent data.`;

  const res = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;

  return {
    headline:
      typeof parsed.headline === "string" && parsed.headline.trim()
        ? parsed.headline.trim()
        : "Your website assistant is on the job.",
    highlights: strList(parsed.highlights),
    actions: strList(parsed.actions),
    generatedAt: new Date().toISOString(),
    mode: "live",
  };
}

function fallbackBriefing(snap: Awaited<ReturnType<typeof snapshot>>): Briefing {
  const week = snap.last7Days.reduce(
    (acc, d) => ({ conversations: acc.conversations + d.conversations, leads: acc.leads + d.leads }),
    { conversations: 0, leads: 0 },
  );

  const highlights = [
    `Your chatbot handled ${week.conversations} conversation${week.conversations === 1 ? "" : "s"} this week and captured ${week.leads} lead${week.leads === 1 ? "" : "s"}.`,
    `${snap.stats.newLeads} lead${snap.stats.newLeads === 1 ? "" : "s"} waiting for a reply out of ${snap.stats.leads} total.`,
  ];
  if (snap.latestAudit) {
    highlights.push(`Latest SEO audit: ${snap.latestAudit.score}/100 for ${shortUrl(snap.latestAudit.url)}.`);
  }

  const actions: string[] = [];
  for (const l of snap.newLeads.slice(0, 2)) {
    actions.push(`Reply to ${l.name} (${l.email}) — "${l.message.slice(0, 60) || "reached out via the chatbot"}".`);
  }
  if (!snap.latestAudit) actions.push("Run your first SEO audit in the Studio to find quick ranking wins.");
  else if (snap.latestAudit.score < 80)
    actions.push(`Work through the audit fixes for ${shortUrl(snap.latestAudit.url)} — the score has room to climb.`);
  if (actions.length === 0) actions.push("All caught up — consider publishing a new post with the AI writer.");

  return {
    headline:
      snap.stats.newLeads > 0
        ? `${snap.stats.newLeads} warm lead${snap.stats.newLeads === 1 ? "" : "s"} waiting — strike while they're interested.`
        : "All quiet — your assistant is answering and nothing needs you right now.",
    highlights,
    actions,
    generatedAt: new Date().toISOString(),
    mode: "fallback",
  };
}

function shortUrl(u: string): string {
  try {
    const p = new URL(u);
    return p.host + (p.pathname === "/" ? "" : p.pathname);
  } catch {
    return u;
  }
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
}
