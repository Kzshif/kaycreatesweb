import type { ChatMessage, Vertical } from "./types";
import { runTool } from "./receptionist";

// A tiny rule-based receptionist used when ANTHROPIC_API_KEY is not set, so the
// product is still clickable end-to-end. It is intentionally simple — the real
// experience is the Claude-powered receptionist. We slot-fill across turns using
// the running transcript.

interface FallbackTurn {
  text: string;
  tool?: { name: string; input: Record<string, string> };
}

// Order matters: longer lead-ins first so "my name is" wins before "my name's".
const NAME_RE =
  /\b(?:my name is|my name'?s|name is|name'?s|this is|i am|i'?m|it'?s)\s+([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+)?)/gi;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_RE = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;

function collect(history: ChatMessage[]): {
  name?: string;
  contact?: string;
  service?: string;
  text: string;
  vertical: Vertical | null;
} {
  const userText = history
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");
  const last = history[history.length - 1]?.content ?? "";
  // Take the first introduction that survives the stopword filter, so phrases
  // like "this is urgent! I'm Lee Park" resolve to "Lee Park", not "urgent".
  let name: string | undefined;
  for (const m of userText.matchAll(NAME_RE)) {
    const candidate = cleanName(m[1]);
    if (candidate) {
      name = candidate;
      break;
    }
  }
  const contact = userText.match(PHONE_RE)?.[1] || userText.match(EMAIL_RE)?.[1];
  return { name, contact, text: last.toLowerCase(), vertical: null };
}

// Words that follow "this is" / "I'm" but aren't names, to avoid capturing
// phrases like "this is urgent" as a caller name.
const NOT_A_NAME = new Set([
  "urgent",
  "an",
  "a",
  "the",
  "calling",
  "regarding",
  "about",
  "for",
  "really",
  "so",
  "very",
  "still",
  "here",
  "fine",
  "okay",
  "ok",
]);

function cleanName(raw?: string): string | undefined {
  if (!raw) return undefined;
  const first = raw.trim().split(/\s+/)[0]?.toLowerCase();
  if (!first || NOT_A_NAME.has(first)) return undefined;
  return raw.trim();
}

export function fallbackReply(
  history: ChatMessage[],
  vertical: Vertical,
  practiceId: string | null = null,
): FallbackTurn {
  const { name, contact, text } = collect(history);
  const lower = text;

  const wantsBooking = /book|appoint|schedule|come in|see (the|a)|cleaning|exam|visit|checkup|check-up/.test(
    lower,
  );
  const wantsMessage = /message|refill|tell (the|him|her)|pass along|leave a/.test(lower);
  const emergency = /emergency|urgent|pain|hurts|bleeding|severe|right now|asap/.test(lower);

  // Answer an FAQ only when the caller isn't clearly trying to take an action.
  if (!wantsBooking && !wantsMessage && !emergency) {
    for (const f of vertical.faq) {
      const keywords = f.q.toLowerCase().replace(/[?.,]/g, "").split(/\s+/).filter((w) => w.length > 4);
      if (keywords.some((k) => lower.includes(k))) {
        return { text: f.a + " Is there anything else I can help with — booking a visit, perhaps?" };
      }
    }

    if (/hour|open|close|when are you/.test(lower)) {
      return { text: `Our hours are ${vertical.hours} What can I help you with?` };
    }
  }

  if (emergency) {
    if (name && contact) {
      runTool(
        "take_message",
        { name, contact, message: history[history.length - 1].content, urgency: "high" },
        vertical,
        practiceId,
      );
      return {
        text: `I'm so sorry you're dealing with that. I've flagged this as urgent and a provider will call you back as soon as possible. If it's a true emergency please don't wait for us.`,
        tool: { name: "take_message", input: { name, contact, urgency: "high" } },
      };
    }
    return {
      text: `I'm sorry to hear that — let me get this to a provider right away. Can I get your name and the best number to reach you?`,
    };
  }

  if (wantsBooking) {
    const service =
      vertical.services.find((s) => lower.includes(s.toLowerCase().split(" ")[0])) ||
      vertical.services[0];
    if (name && contact) {
      runTool(
        "book_appointment",
        { name, contact, service, preferred_time: "next available", notes: "via web demo" },
        vertical,
        practiceId,
      );
      return {
        text: `Perfect, ${name.split(" ")[0]} — I've put in a request for ${service.toLowerCase()} and the office will call ${contact} to lock in the exact time. Anything else?`,
        tool: { name: "book_appointment", input: { name, contact, service } },
      };
    }
    if (!name) return { text: `Happy to get that booked! Can I start with your name?` };
    return { text: `Thanks ${name.split(" ")[0]}. And what's the best phone number or email to confirm?` };
  }

  if (wantsMessage) {
    if (name && contact) {
      runTool(
        "take_message",
        { name, contact, message: history[history.length - 1].content, urgency: "normal" },
        vertical,
        practiceId,
      );
      return {
        text: `Got it — I've passed that along to the team and they'll follow up. Anything else I can do?`,
        tool: { name: "take_message", input: { name, contact, urgency: "normal" } },
      };
    }
    return { text: `Of course, I can take a message. What's your name and a number to reach you?` };
  }

  if (/yes|yeah|sure|please/.test(lower) && name && contact) {
    return { text: `Great — would you like to book an appointment, or shall I take a message for the team?` };
  }

  // Default.
  return {
    text: `I can help with booking appointments, answering questions about ${vertical.practice}, or taking a message. What do you need today?`,
  };
}
