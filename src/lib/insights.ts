import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./receptionist";
import { dailySeries, intentBreakdown, listEvents, stats } from "./store";
import { urgencyLabel } from "./triage";
import type { Briefing, CapturedEvent, Practice } from "./types";

// The AI daily briefing: a Claude-written morning summary of what the
// receptionist handled — what's urgent, what's trending, what to do first.
// Cached per practice per day; without an API key it degrades to a
// deterministic briefing built from the same numbers.

const g = globalThis as unknown as {
  __fdBriefings?: Map<string, Briefing>;
};

function cache(): Map<string, Briefing> {
  if (!g.__fdBriefings) g.__fdBriefings = new Map();
  return g.__fdBriefings;
}

/** Compact, model-readable snapshot of the practice's recent activity. */
export function activitySnapshot(practice: Practice) {
  const s = stats(practice.id);
  const series = dailySeries(practice.id, 7);
  const intents = intentBreakdown(practice.id, 7);
  const open = listEvents({ practiceId: practice.id })
    .filter((e) => e.status === "new")
    .slice(0, 15);
  return { stats: s, last7Days: series, topIntents: intents, openItems: open };
}

function describeEvent(e: CapturedEvent): string {
  const when = new Date(e.createdAt).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return `- [${e.kind}] ${e.name} (${e.contact}) · ${e.summary} · urgency ${urgencyLabel(e.urgency)} · sentiment ${e.sentiment} · ${when}`;
}

export async function getBriefing(practice: Practice, refresh = false): Promise<Briefing> {
  const key = `${practice.id}:${new Date().toISOString().slice(0, 10)}`;
  if (!refresh) {
    const hit = cache().get(key);
    if (hit) return hit;
  }

  const snapshot = activitySnapshot(practice);
  const briefing = process.env.ANTHROPIC_API_KEY
    ? await liveBriefing(practice, snapshot).catch(() => fallbackBriefing(snapshot))
    : fallbackBriefing(snapshot);

  cache().set(key, briefing);
  return briefing;
}

async function liveBriefing(
  practice: Practice,
  snapshot: ReturnType<typeof activitySnapshot>,
): Promise<Briefing> {
  const client = new Anthropic();
  const openList = snapshot.openItems.map(describeEvent).join("\n") || "(none)";
  const intents = snapshot.topIntents.map((i) => `${i.intent}: ${i.count}`).join(", ") || "(none)";
  const volume = snapshot.last7Days
    .map((d) => `${d.day}: ${d.appointment + d.message + d.callback}`)
    .join(", ");

  const prompt = `You write the morning front-desk briefing for ${practice.name}, a ${practice.vertical} practice using an AI receptionist.

Data:
- Totals: ${snapshot.stats.total} handled all-time, ${snapshot.stats.unactioned} awaiting action, ${snapshot.stats.urgent} open urgent items.
- Volume by day (last 7 days): ${volume}
- Top caller intents (last 7 days): ${intents}
- Open items:
${openList}

Write a briefing as strict JSON (no markdown, no commentary) with this shape:
{"headline": "<one energetic sentence summarizing the state of the front desk>",
 "highlights": ["<2-4 short observations grounded in the data — trends, notable callers, patterns>"],
 "actions": ["<2-3 concrete next steps for staff, most urgent first>"]}

Be specific: use names, counts, and intents from the data. Never invent data.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = extractJson(text);
  if (!parsed) return fallbackBriefing(snapshot);

  return {
    headline: str(parsed.headline, "Your front desk is up to date."),
    highlights: strList(parsed.highlights),
    actions: strList(parsed.actions),
    generatedAt: new Date().toISOString(),
    mode: "live",
  };
}

function fallbackBriefing(snapshot: ReturnType<typeof activitySnapshot>): Briefing {
  const { stats: s, topIntents } = snapshot;
  const today = snapshot.last7Days[snapshot.last7Days.length - 1];
  const todayTotal = today ? today.appointment + today.message + today.callback : 0;
  const urgentFirst = snapshot.openItems.filter((e) => e.urgency >= 4);

  const highlights = [
    `Robin has handled ${s.total} conversations so far — ${s.appointments} bookings, ${s.messages} messages, ${s.callbacks} callbacks.`,
    `${todayTotal} came in today; ${s.unactioned} item${s.unactioned === 1 ? "" : "s"} still need${s.unactioned === 1 ? "s" : ""} a human touch.`,
  ];
  if (topIntents[0]) {
    highlights.push(`Most common reason people reach out: ${topIntents[0].intent} (${topIntents[0].count} in the last week).`);
  }

  const actions: string[] = [];
  for (const e of urgentFirst.slice(0, 2)) {
    actions.push(`Call ${e.name} back first — ${e.summary.toLowerCase()} (${e.contact}).`);
  }
  if (s.unactioned > urgentFirst.length) {
    actions.push(`Work through the remaining ${s.unactioned - Math.min(2, urgentFirst.length)} open inbox items.`);
  }
  if (actions.length === 0) actions.push("Inbox is clear — enjoy the quiet while it lasts.");

  return {
    headline:
      s.urgent > 0
        ? `${s.urgent} urgent item${s.urgent === 1 ? "" : "s"} need${s.urgent === 1 ? "s" : ""} attention — everything else is under control.`
        : `All quiet: ${s.unactioned} open item${s.unactioned === 1 ? "" : "s"}, nothing urgent.`,
    highlights,
    actions,
    generatedAt: new Date().toISOString(),
    mode: "fallback",
  };
}

// --- helpers -----------------------------------------------------------------

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const v = JSON.parse(text.slice(start, end + 1));
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
}
