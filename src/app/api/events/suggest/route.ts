import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { MODEL } from "@/lib/receptionist";
import { getEvent } from "@/lib/store";
import { tenantFromRequest } from "@/lib/tenant";
import { urgencyLabel } from "@/lib/triage";
import type { CapturedEvent, Practice } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI-drafted reply for an inbox item: a short text/voicemail script staff can
// send as-is or tweak. Falls back to sensible templates without an API key.

export async function POST(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const event = body.id ? getEvent(body.id) : null;
  if (!event || event.practiceId !== tenant.practice.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ suggestion: templateReply(event, tenant.practice), mode: "fallback" });
  }

  try {
    const suggestion = await liveReply(event, tenant.practice);
    return NextResponse.json({ suggestion, mode: "live" });
  } catch {
    return NextResponse.json({ suggestion: templateReply(event, tenant.practice), mode: "fallback" });
  }
}

async function liveReply(event: CapturedEvent, practice: Practice): Promise<string> {
  const client = new Anthropic();
  const details = Object.entries(event.details)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `You draft short follow-up messages for the front desk of ${practice.name}, a ${practice.vertical} practice. Write ONLY the message text — no preamble, no quotes, no sign-off placeholders. Warm, professional, 2-4 sentences, ready to send as an SMS. Never give clinical advice; for clinical issues, say a provider will discuss it with them.`,
    messages: [
      {
        role: "user",
        content: `Draft a reply to this ${event.kind} captured by our AI receptionist:
Caller: ${event.name} (${event.contact})
Summary: ${event.summary}
Details: ${details || "(none)"}
Urgency: ${urgencyLabel(event.urgency)}; sentiment: ${event.sentiment}.
Practice hours: ${practice.hours}`,
      },
    ],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("empty suggestion");
  return text;
}

function templateReply(event: CapturedEvent, practice: Practice): string {
  const first = event.name.split(" ")[0];
  switch (event.kind) {
    case "appointment":
      return `Hi ${first}, this is ${practice.name}. We received your appointment request${
        event.details.service ? ` for ${event.details.service.toLowerCase()}` : ""
      } and we're confirming your exact time now — we'll text you the confirmed slot shortly. Reply here if anything changes!`;
    case "callback":
      return `Hi ${first}, it's ${practice.name} returning your call. Sorry we missed you — we're available ${practice.hours} What time works best to reach you?`;
    default:
      return event.urgency >= 4
        ? `Hi ${first}, this is ${practice.name}. We got your message and a member of our team is prioritizing it right now — expect a call from us very shortly. If things get worse in the meantime, please seek urgent care.`
        : `Hi ${first}, this is ${practice.name}. Thanks for your message — we've passed it to the right person and you'll hear back from us within one business day.`;
  }
}
