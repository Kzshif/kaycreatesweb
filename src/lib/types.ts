// Shared types for NovaWebStudio (NOVA05) — AI chatbots & SEO for any website.

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type PlanId = "trial" | "launch" | "grow" | "scale";

/** The tenant: one business / website. */
export interface Workspace {
  id: string;
  userId: string;
  name: string;
  website: string;
  /** Short description of the business — feeds every AI surface. */
  about: string;
  plan: PlanId;
  trialEndsAt: string; // ISO
  createdAt: string; // ISO
}

export type BotGoal = "support" | "leads" | "sales";

/** An embeddable AI chatbot. */
export interface Bot {
  id: string;
  workspaceId: string;
  /** Public embed key used by the widget script. */
  publicKey: string;
  name: string;
  /** Bot personality: friendly | professional | playful | concise. */
  tone: string;
  goal: BotGoal;
  welcome: string;
  /** Everything the bot should know: offering, pricing, hours, policies… */
  knowledge: string;
  faq: { q: string; a: string }[];
  /** Widget accent color (hex). */
  color: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  botId: string;
  workspaceId: string;
  visitorId: string;
  /** Trimmed transcript, newest last. */
  transcript: ChatMessage[];
  messageCount: number;
  startedAt: string;
  lastMessageAt: string;
}

export interface Lead {
  id: string;
  botId: string;
  workspaceId: string;
  name: string;
  email: string;
  message: string;
  /** Where it came from, e.g. the bot name or page. */
  source: string;
  status: "new" | "contacted";
  createdAt: string;
}

// --- SEO Studio ---------------------------------------------------------------

export interface SeoCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface SeoAudit {
  id: string;
  workspaceId: string;
  url: string;
  score: number; // 0-100
  checks: SeoCheck[];
  /** AI-written prioritized recommendations (or heuristic fallback). */
  recommendations: string[];
  /** AI-suggested rewrites. */
  suggestedTitle: string;
  suggestedDescription: string;
  mode: "live" | "fallback";
  createdAt: string;
}

// --- Wire protocol --------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Streaming NDJSON events shared by the widget + app chat surfaces.
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; label: string }
  | { type: "error"; message: string }
  | { type: "done"; mode: "live" | "fallback" };

export interface Invoice {
  id: string;
  workspaceId: string;
  description: string;
  amountCents: number;
  createdAt: string;
}

/** AI weekly-pulse briefing produced by /api/insights. */
export interface Briefing {
  headline: string;
  highlights: string[];
  actions: string[];
  generatedAt: string;
  mode: "live" | "fallback";
}
