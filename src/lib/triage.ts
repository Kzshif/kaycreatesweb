import type { CapturedKind, Triage } from "./types";

// Instant triage scoring applied to every captured event at write time, so the
// inbox can sort and badge without waiting on a model call. The Claude-powered
// layers (daily briefing, copilot, suggested replies) build on top of these
// signals rather than replacing them — capture must never block on the API.

const NEGATIVE = /pain|hurt|ache|bleed|swollen|broken|crack|emergency|urgent|worse|worried|scared|upset|frustrat|angry|complain|cancel|refund|wrong/i;
const POSITIVE = /thank|great|love|happy|wonderful|excited|perfect|appreciate/i;

const HIGH_URGENCY = /emergency|urgent|severe|bleeding|asap|right now|same.day|can'?t (eat|sleep|walk|breathe)|unbearable/i;
const MED_URGENCY = /pain|hurt|refill|sick|fever|vomit|limping|today|soon/i;

const INTENTS: [RegExp, string][] = [
  [/refill|prescription|medication/i, "refill"],
  [/insurance|coverage|in.network|ppo|copay/i, "insurance"],
  [/bill|invoice|payment|charge|cost|price|how much/i, "billing"],
  [/cancel|reschedul|move my/i, "reschedule"],
  [/emergency|urgent|pain|hurt|bleed/i, "urgent care"],
  [/new patient|first (visit|time)/i, "new patient"],
  [/\bresults?\b|\blabs?\b|x-?ray|\breports?\b/i, "results"],
];

export function triageEvent(kind: CapturedKind, summary: string, notes: string): Triage {
  const text = `${summary} ${notes}`;

  const sentiment = NEGATIVE.test(text) ? "negative" : POSITIVE.test(text) ? "positive" : "neutral";

  let urgency = kind === "appointment" ? 2 : 1;
  if (MED_URGENCY.test(text)) urgency = 3;
  if (HIGH_URGENCY.test(text)) urgency = 5;
  if (kind === "message" && /high/i.test(notes) && urgency < 4) urgency = 4;

  let intent = kind === "appointment" ? "booking" : kind === "callback" ? "callback" : "general";
  for (const [re, label] of INTENTS) {
    if (re.test(text)) {
      intent = label;
      break;
    }
  }

  return { sentiment, urgency, intent };
}

export function urgencyLabel(urgency: number): string {
  if (urgency >= 5) return "Critical";
  if (urgency >= 4) return "High";
  if (urgency >= 3) return "Elevated";
  return "Routine";
}
