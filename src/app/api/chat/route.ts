import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { planStatus, recordConversation } from "@/lib/billing";
import { fallbackReply } from "@/lib/fallback";
import { practiceToVertical } from "@/lib/practices";
import {
  MODEL,
  TOOLS,
  buildSystemPrompt,
  runTool,
} from "@/lib/receptionist";
import { tenantFromRequest } from "@/lib/tenant";
import { getVertical } from "@/lib/verticals";
import type { ChatMessage, StreamEvent, Vertical } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOOL_ITERATIONS = 6;

function send(controller: ReadableStreamDefaultController, enc: TextEncoder, e: StreamEvent) {
  controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
}

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; vertical?: string; scope?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // scope: "practice" runs the caller's own configured receptionist (authed,
  // metered against their plan); anything else runs the public demo.
  let vertical: Vertical;
  let practiceId: string | null = null;
  if (body.scope === "practice") {
    const tenant = tenantFromRequest(req);
    if (!tenant) return new Response("Unauthorized", { status: 401 });
    const status = planStatus(tenant.practice);
    if (status.overLimit) {
      return Response.json(
        {
          error: status.trialExpired
            ? "Your free trial has ended. Pick a plan to keep Robin answering."
            : "You've used this month's included conversations. Upgrade to keep Robin answering.",
        },
        { status: 402 },
      );
    }
    vertical = practiceToVertical(tenant.practice);
    practiceId = tenant.practice.id;
  } else {
    vertical = getVertical(body.vertical);
  }

  const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (history.length === 0 || history[history.length - 1]?.role !== "user") {
    return new Response("Expected a user message", { status: 400 });
  }

  // Meter once per user turn, at the start of the conversation.
  if (practiceId && history.filter((m) => m.role === "user").length === 1) {
    recordConversation(practiceId);
  }

  const enc = new TextEncoder();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!hasKey) {
          await runFallback(controller, enc, history, vertical, practiceId);
        } else {
          await runLive(controller, enc, history, vertical, practiceId);
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

// --- Live: Claude with the agentic tool-use loop --------------------------

async function runLive(
  controller: ReadableStreamDefaultController,
  enc: TextEncoder,
  history: ChatMessage[],
  vertical: Vertical,
  practiceId: string | null,
) {
  const client = new Anthropic();
  const system = buildSystemPrompt(vertical);

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const ms = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools: TOOLS,
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
      const { result, label, event } = runTool(
        tu.name,
        (tu.input ?? {}) as Record<string, unknown>,
        vertical,
        practiceId,
      );
      send(controller, enc, { type: "tool", name: tu.name, label, event });
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  send(controller, enc, { type: "done", mode: "live" });
}

// --- Fallback: rule-based receptionist (no API key) -----------------------

async function runFallback(
  controller: ReadableStreamDefaultController,
  enc: TextEncoder,
  history: ChatMessage[],
  vertical: Vertical,
  practiceId: string | null,
) {
  const turn = fallbackReply(history, vertical, practiceId);

  // The rule-based responder already wrote any captured event to the store
  // inside fallbackReply(); surface a matching tool marker to the UI.
  if (turn.tool) {
    const labelMap: Record<string, string> = {
      book_appointment: `📅 Appointment requested — ${turn.tool.input.name ?? ""}`,
      take_message: `📝 Message taken — ${turn.tool.input.name ?? ""}${
        turn.tool.input.urgency === "high" ? " (urgent)" : ""
      }`,
      request_callback: `📞 Callback requested — ${turn.tool.input.name ?? ""}`,
    };
    send(controller, enc, {
      type: "tool",
      name: turn.tool.name,
      label: labelMap[turn.tool.name] ?? turn.tool.name,
    });
  }

  // Simulate streaming by chunking the response into words.
  const words = turn.text.split(" ");
  for (let i = 0; i < words.length; i++) {
    send(controller, enc, { type: "text", text: (i === 0 ? "" : " ") + words[i] });
    await new Promise((r) => setTimeout(r, 18));
  }

  send(controller, enc, { type: "done", mode: "fallback" });
}
