import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getVertical } from "@/lib/verticals";
import { MODEL, TOOLS, cachedSystem, runTool } from "@/lib/receptionist";
import { fallbackReply } from "@/lib/fallback";
import type { ChatMessage, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TOOL_ITERATIONS = 6;

function send(controller: ReadableStreamDefaultController, enc: TextEncoder, e: StreamEvent) {
  controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
}

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; vertical?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const vertical = getVertical(body.vertical);
  const history: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (history.length === 0 || history[history.length - 1]?.role !== "user") {
    return new Response("Expected a user message", { status: 400 });
  }

  const enc = new TextEncoder();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!hasKey) {
          await runFallback(controller, enc, history, vertical);
        } else {
          await runLive(controller, enc, history, vertical);
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
  vertical: ReturnType<typeof getVertical>,
) {
  const client = new Anthropic();
  const system = cachedSystem(vertical);

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
  vertical: ReturnType<typeof getVertical>,
) {
  const turn = fallbackReply(history, vertical);

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
