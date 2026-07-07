import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai";
import { getLead } from "@/lib/convos";
import { tenantFromRequest } from "@/lib/tenant";
import type { Lead, Workspace } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI-drafted follow-up email for a captured lead — ready to send or tweak.

export async function POST(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const lead = body.id ? await getLead(body.id, tenant.workspace.id) : null;
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ suggestion: templateReply(lead, tenant.workspace), mode: "fallback" });
  }

  try {
    const suggestion = await liveReply(lead, tenant.workspace);
    return NextResponse.json({ suggestion, mode: "live" });
  } catch {
    return NextResponse.json({ suggestion: templateReply(lead, tenant.workspace), mode: "fallback" });
  }
}

async function liveReply(lead: Lead, workspace: Workspace): Promise<string> {
  const client = new Anthropic();
  const model = await getModel(client);
  const res = await client.messages.create({
    model,
    max_tokens: 350,
    system: `You draft short follow-up emails for ${workspace.name}${
      workspace.about ? ` (${workspace.about.slice(0, 300)})` : ""
    }. Write ONLY the email body — no subject line, no quotes, no placeholders like [Your Name]. Warm, professional, 3-5 sentences, ends with a clear next step. Sign off as "The ${workspace.name} team".`,
    messages: [
      {
        role: "user",
        content: `Draft a follow-up to this lead captured by our website chatbot:
Name: ${lead.name}
Email: ${lead.email}
What they said: ${lead.message || "(no message — they just left their contact details)"}
Captured: ${new Date(lead.createdAt).toDateString()}`,
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

function templateReply(lead: Lead, workspace: Workspace): string {
  const first = lead.name.replace(/^Sample:\s*/i, "").split(" ")[0];
  return `Hi ${first},

Thanks for reaching out on our website${
    lead.message ? ` about "${lead.message.slice(0, 80)}"` : ""
  } — great to hear from you! We'd love to help. Would a quick call this week work, or would you prefer we send details over email?

The ${workspace.name} team`;
}
