// Shared types for FrontDesk AI.

export type VerticalId = "dental" | "medical" | "physio" | "vet";

export interface Vertical {
  id: VerticalId;
  /** Display name of the example practice. */
  practice: string;
  /** Short label for the vertical (e.g. "Dental clinic"). */
  label: string;
  tagline: string;
  /** Services the receptionist can book or quote. */
  services: string[];
  hours: string;
  /** A few canned FAQ answers the receptionist should know. */
  faq: { q: string; a: string }[];
  /** Greeting shown at the top of the demo chat. */
  greeting: string;
  /** Accent emoji for the UI. */
  emoji: string;
}

export type CapturedKind = "appointment" | "message" | "callback";

export type Sentiment = "positive" | "neutral" | "negative";

/** Instant scoring applied to every capture — see lib/triage.ts. */
export interface Triage {
  sentiment: Sentiment;
  /** 1 (routine) … 5 (critical). */
  urgency: number;
  /** Short intent label, e.g. "refill", "insurance", "booking". */
  intent: string;
}

export interface CapturedEvent {
  id: string;
  kind: CapturedKind;
  vertical: VerticalId;
  /** Owning practice, or null for the public demo. */
  practiceId: string | null;
  createdAt: string; // ISO
  /** Caller / patient name. */
  name: string;
  /** Phone or email. */
  contact: string;
  /** Free-form summary the receptionist captured. */
  summary: string;
  /** Structured extras depending on kind. */
  details: Record<string, string>;
  /** "new" until a human at the practice has actioned it. */
  status: "new" | "actioned";
  sentiment: Sentiment;
  urgency: number;
  intent: string;
}

// Wire protocol for the streaming chat endpoint (newline-delimited JSON).
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; label: string; event?: CapturedEvent }
  | { type: "error"; message: string }
  | { type: "done"; mode: "live" | "fallback" };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// --- SaaS layer -------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type PlanId = "trial" | "starter" | "practice" | "group";

export interface Practice {
  id: string;
  userId: string;
  name: string;
  vertical: VerticalId;
  hours: string;
  services: string[];
  faq: { q: string; a: string }[];
  greeting: string;
  plan: PlanId;
  trialEndsAt: string; // ISO
  createdAt: string; // ISO
}

export interface Invoice {
  id: string;
  practiceId: string;
  description: string;
  amountCents: number;
  createdAt: string;
}

/** AI daily briefing produced by /api/insights. */
export interface Briefing {
  headline: string;
  highlights: string[];
  actions: string[];
  generatedAt: string;
  mode: "live" | "fallback";
}
