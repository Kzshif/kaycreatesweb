import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import type { ChatMessage } from "./types";

// Per-call transcript, keyed by Twilio CallSid. Twilio is stateless between
// webhook hits, so we keep the running conversation here for the life of the
// call. Memoised on globalThis to survive hot reloads.
const g = globalThis as unknown as { __calls?: Map<string, ChatMessage[]> };
function calls(): Map<string, ChatMessage[]> {
  if (!g.__calls) g.__calls = new Map();
  return g.__calls;
}

export function getTranscript(callSid: string): ChatMessage[] {
  return calls().get(callSid) ?? [];
}
export function setTranscript(callSid: string, messages: ChatMessage[]) {
  calls().set(callSid, messages.slice(-24));
}
export function endCall(callSid: string) {
  calls().delete(callSid);
}

// --- TwiML helpers --------------------------------------------------------

const VOICE = "Polly.Joanna";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function twiml(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${inner}</Response>`;
}

export function say(text: string): string {
  return `<Say voice="${VOICE}">${escapeXml(text)}</Say>`;
}

/** Speak a prompt, then listen for the caller's speech and POST it to `action`. */
export function gather(prompt: string, action: string): string {
  return (
    `<Gather input="speech" method="POST" action="${escapeXml(action)}" ` +
    `speechTimeout="auto" language="en-US">${say(prompt)}</Gather>` +
    // If the caller says nothing, re-prompt by redirecting back to the action.
    `<Redirect method="POST">${escapeXml(action)}</Redirect>`
  );
}

export function hangup(text: string): string {
  return `${say(text)}<Hangup/>`;
}

export function twimlResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

// --- Request parsing & signature validation -------------------------------

export async function parseTwilioForm(req: NextRequest): Promise<Record<string, string>> {
  const form = await req.formData();
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) out[k] = typeof v === "string" ? v : "";
  return out;
}

/** The absolute URL Twilio used to reach us (it signs against this exact URL). */
export function publicUrl(req: NextRequest, pathWithQuery: string): string {
  const base =
    process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;
  return `${base}${pathWithQuery}`;
}

/**
 * Validate Twilio's X-Twilio-Signature. Twilio computes
 * base64(HMAC-SHA1(authToken, url + sorted(k+v for each param))).
 * Only enforced when TWILIO_AUTH_TOKEN is set.
 */
export function validateSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true; // not configured — skip (dev / demo)
  if (!signature) return false;

  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  const expected = crypto.createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
