import type Anthropic from "@anthropic-ai/sdk";
import type { Vertical } from "./types";
import { addEvent } from "./store";

// Model is configurable so you can trade cost for capability without a code
// change. Default to Opus 4.8; set RECEPTIONIST_MODEL=claude-haiku-4-5 (cheapest)
// or claude-sonnet-4-6 (balanced) to cut running costs for a receptionist.
export const MODEL = process.env.RECEPTIONIST_MODEL || "claude-opus-4-8";

// Wrap the system prompt as a cacheable block. The prompt is large and identical
// across turns, so prompt caching cuts input cost dramatically (~90% on the
// cached prefix) for multi-turn calls.
export function cachedSystem(vertical: Vertical) {
  return [
    {
      type: "text" as const,
      text: buildSystemPrompt(vertical),
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(v: Vertical): string {
  const services = v.services.map((s) => `  - ${s}`).join("\n");
  const faq = v.faq.map((f) => `  Q: ${f.q}\n  A: ${f.a}`).join("\n\n");

  return `You are Robin, the AI receptionist for ${v.practice}, a ${v.label.toLowerCase()}.
You answer the phone and chat exactly like a warm, efficient human front-desk receptionist would.

# Your job
- Greet callers, answer questions about the practice, and capture what the front desk needs.
- Book appointments, take messages, and arrange callbacks using your tools.
- You CANNOT give medical or clinical advice or diagnose. For anything clinical,
  reassure the caller and take a message so a provider can follow up.

# Practice facts
- Hours: ${v.hours}
- Services we handle:
${services}

# Frequently asked questions
${faq}

# How to handle a call
1. Be brief and natural — one or two sentences per turn, like a real phone call.
2. Collect the details a tool needs BEFORE calling it. To book an appointment you
   need the caller's name, a callback number or email, the service, and a preferred
   day/time. To take a message you need a name, contact, and the message.
3. Don't invent confirmed appointment times you can't actually verify — offer a
   preferred window and tell the caller the office will confirm the exact slot.
4. After you successfully use a tool, confirm warmly in plain language what you did.
5. If a caller mentions severe symptoms or an emergency, calmly take a high-urgency
   message and, when appropriate, point them to urgent/emergency care.

Keep responses short, friendly, and human. Never mention that you are an AI unless asked directly.`;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "book_appointment",
    description:
      "Book or request an appointment once you have the caller's name, contact, service, and preferred day/time. The office confirms the exact slot afterward.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Caller / patient name" },
        contact: { type: "string", description: "Phone number or email for confirmation" },
        service: { type: "string", description: "The service being booked" },
        preferred_time: {
          type: "string",
          description: "Caller's preferred day and time window, e.g. 'Thursday morning'",
        },
        notes: { type: "string", description: "Any extra context (new patient, insurance, etc.)" },
      },
      required: ["name", "contact", "service", "preferred_time"],
    },
  },
  {
    name: "take_message",
    description:
      "Record a message for the practice staff when the caller needs a non-booking follow-up (refill, billing, clinical question, emergency triage).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Caller / patient name" },
        contact: { type: "string", description: "Phone number or email" },
        message: { type: "string", description: "The message to pass along" },
        urgency: {
          type: "string",
          enum: ["low", "normal", "high"],
          description: "How urgent the message is",
        },
      },
      required: ["name", "contact", "message"],
    },
  },
  {
    name: "request_callback",
    description:
      "Schedule a callback from a staff member when the caller wants someone to call them back.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Caller name" },
        contact: { type: "string", description: "Best number to reach them" },
        reason: { type: "string", description: "What the callback is about" },
      },
      required: ["name", "contact", "reason"],
    },
  },
];

type ToolInput = Record<string, unknown>;
const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

// Executes a tool call: writes to the store and returns a (result string, label,
// captured event) so the API route can both feed Claude and stream to the UI.
export function runTool(
  name: string,
  input: ToolInput,
  vertical: Vertical,
): { result: string; label: string; event: ReturnType<typeof addEvent> } {
  switch (name) {
    case "book_appointment": {
      const event = addEvent({
        kind: "appointment",
        vertical: vertical.id,
        name: str(input.name),
        contact: str(input.contact),
        summary: `Booked ${str(input.service, "appointment")}`,
        details: {
          service: str(input.service),
          when: str(input.preferred_time),
          notes: str(input.notes),
        },
      });
      return {
        result: `Appointment request recorded (ref ${event.id}). The office will confirm the exact slot.`,
        label: `📅 Appointment requested — ${event.name}, ${str(input.service)}`,
        event,
      };
    }
    case "take_message": {
      const urgency = str(input.urgency, "normal");
      const event = addEvent({
        kind: "message",
        vertical: vertical.id,
        name: str(input.name),
        contact: str(input.contact),
        summary: str(input.message).slice(0, 80),
        details: { urgency, notes: str(input.message) },
      });
      return {
        result: `Message recorded (ref ${event.id}), urgency ${urgency}.`,
        label: `📝 Message taken — ${event.name}${urgency === "high" ? " (urgent)" : ""}`,
        event,
      };
    }
    case "request_callback": {
      const event = addEvent({
        kind: "callback",
        vertical: vertical.id,
        name: str(input.name),
        contact: str(input.contact),
        summary: str(input.reason).slice(0, 80),
        details: { notes: str(input.reason) },
      });
      return {
        result: `Callback scheduled (ref ${event.id}).`,
        label: `📞 Callback requested — ${event.name}`,
        event,
      };
    }
    default:
      return {
        result: `Unknown tool: ${name}`,
        label: `⚠️ Unknown tool ${name}`,
        event: addEvent({
          kind: "message",
          vertical: vertical.id,
          name: "system",
          contact: "—",
          summary: `Unknown tool ${name}`,
        }),
      };
  }
}
