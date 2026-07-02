import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getUsage, planStatus } from "@/lib/billing";
import { activitySnapshot } from "@/lib/insights";
import { MODEL } from "@/lib/receptionist";
import { listEvents, stats } from "@/lib/store";
import { tenantFromRequest } from "@/lib/tenant";
import { urgencyLabel } from "@/lib/triage";
import type { ChatMessage, Practice, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOOL_ITERATIONS = 8;

// The front-desk Copilot: a streaming Claude agent that answers questions
// about the practice's own captured data using query tools — "what happened
// today?", "who should I call back first?", "are refill requests trending up?".

const COPILOT_TOOLS: Anthropic.Tool[] = [
  {
    name: "query_events",
    description:
      "Search the practice's captured events (appointments, messages, callbacks). Returns the matching rows, newest first.",
    input_schema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["appointment", "message", "callback"],
          description: "Filter to one kind of event",
        },
        status: { type: "string", enum: ["new", "actioned"], description: "Filter by status" },
        min_urgency: {
          type: "integer",
          description: "Only events with urgency >= this (1 routine … 5 critical)",
        },
        days: { type: "integer", description: "Only events from the last N days" },
        limit: { type: "integer", description: "Max rows to return (default 20)" },
      },
    },
  },
  {
    name: "get_stats",
    description:
      "Get aggregate numbers: totals by kind, open items, urgent count, and this month's conversation usage vs. plan limit.",
    input_schema: { type: "object", properties: {} },
  },
];

function runCopilotTool(name: string, input: Record<string, unknown>, practice: Practice): string {
  if (name === "get_stats") {
    const s = stats(practice.id);
    const status = planStatus(practice);
    return JSON.stringify({
      ...s,
      usageThisMonth: getUsage(practice.id),
      planLimit: status.limit ?? "unlimited",
      plan: status.planName,
    });
  }
  if (name === "query_events") {
    const days = typeof input.days === "number" ? input.days : undefined;
    const since = days ? Date.now() - days * 86_400_000 : 0;
    const limit = Math.min(50, typeof input.limit === "number" ? input.limit : 20);
    const rows = listEvents({ practiceId: practice.id })
      .filter((e) => (input.kind ? e.kind === input.kind : true))
      .filter((e) => (input.status ? e.status === input.status : true))
      .filter((e) =>
        typeof input.min_urgency === "number" ? e.urgency >= input.min_urgency : true,
      )
      .filter((e) => new Date(e.createdAt).getTime() >= since)
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        name: e.name,
        contact: e.contact,
        summary: e.summary,
        details: e.details,
        status: e.status,
        urgency: `${e.urgency} (${urgencyLabel(e.urgency)})`,
        sentiment: e.sentiment,
        intent: e.intent,
        createdAt: e.createdAt,
      }));
    return JSON.stringify({ count: rows.length, events: rows });
  }
  return JSON.stringify({ error: `Unknown tool ${name}` });
}

function buildCopilotSystem(practice: Practice): string {
  return `You are the FrontDesk AI Copilot for ${practice.name}, a ${practice.vertical} practice.
You help front-desk staff understand and act on what Robin (the AI receptionist) captured.

- Answer using the query_events and get_stats tools — never invent data.
- Today's date is ${new Date().toDateString()}.
- Be concise and practical. Use short paragraphs or tight bullet lists.
- When you reference a caller, include their name and contact so staff can act immediately.
- When asked "who should I call first", rank by urgency, then negative sentiment, then age.
- You cannot modify data; if asked to, explain that items are actioned from the Inbox.`;
}

function send(controller: ReadableStreamDefaultController, enc: TextEncoder, e: StreamEvent) {
  controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
}

export async function POST(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return new Response("Unauthorized", { status: 401 });

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
  if (history.length === 0 || history[history.length - 1]?.role !== "user") {
    return new Response("Expected a user message", { status: 400 });
  }

  const enc = new TextEncoder();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const practice = tenant.practice;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!hasKey) {
          await runFallback(controller, enc, practice);
        } else {
          await runLive(controller, enc, history, practice);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        send(controller, enc, { type: "error", message });
        send(controller, enc, { type: "done", mode: hasKey ? "live" : "fallback" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

async function runLive(
  controller: ReadableStreamDefaultController,
  enc: TextEncoder,
  history: ChatMessage[],
  practice: Practice,
) {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const ms = client.messages.stream({
      model: MODEL,
      max_tokens: 1500,
      system: buildCopilotSystem(practice),
      tools: COPILOT_TOOLS,
      messages,
    });

    ms.on("text", (delta) => send(controller, enc, { type: "text", text: delta }));

    const final = await ms.finalMessage();
    messages.push({ role: "assistant", content: final.content });

    if (final.stop_reason !== "tool_use") break;

    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const label = tu.name === "get_stats" ? "📊 Checked the numbers" : "🔎 Searched your events";
      send(controller, enc, { type: "tool", name: tu.name, label });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: runCopilotTool(tu.name, (tu.input ?? {}) as Record<string, unknown>, practice),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  send(controller, enc, { type: "done", mode: "live" });
}

// Without an API key, answer with a data-grounded summary so the surface still works.
async function runFallback(
  controller: ReadableStreamDefaultController,
  enc: TextEncoder,
  practice: Practice,
) {
  const snapshot = activitySnapshot(practice);
  const urgent = snapshot.openItems.filter((e) => e.urgency >= 4);
  const lines = [
    `Here's where things stand for ${practice.name}:`,
    `• ${snapshot.stats.unactioned} open item${snapshot.stats.unactioned === 1 ? "" : "s"} (${snapshot.stats.urgent} urgent) out of ${snapshot.stats.total} total conversations.`,
  ];
  if (urgent[0]) {
    lines.push(`• Call ${urgent[0].name} first — ${urgent[0].summary.toLowerCase()} (${urgent[0].contact}).`);
  }
  if (snapshot.topIntents[0]) {
    lines.push(`• Most common reason people reach out this week: ${snapshot.topIntents[0].intent}.`);
  }
  lines.push(
    "",
    "Add an ANTHROPIC_API_KEY to unlock the full conversational Copilot — I'll be able to answer any question about your data.",
  );

  const words = lines.join("\n").split(" ");
  for (let i = 0; i < words.length; i++) {
    send(controller, enc, { type: "text", text: (i === 0 ? "" : " ") + words[i] });
    await new Promise((r) => setTimeout(r, 12));
  }
  send(controller, enc, { type: "done", mode: "fallback" });
}
