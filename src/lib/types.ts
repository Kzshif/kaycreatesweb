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

export type CapturedKind = "appointment" | "message" | "callback" | "signup";

export interface CapturedEvent {
  id: string;
  kind: CapturedKind;
  vertical: VerticalId;
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
