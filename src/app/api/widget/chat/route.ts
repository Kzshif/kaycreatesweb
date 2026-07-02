import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { MODEL } from "@/lib/ai";
import { planStatus, recordMessage } from "@/lib/billing";
import { BOT_TOOLS, buildBotSystemPrompt, fallbackBotReply, getBotByKey, runBotTool } from "@/lib/bots";
import { logConversation } from "@/lib/convos";
import { DEMO_BOT, DEMO_WORKSPACE } from "@/lib/demo-bot";
import { getWorkspace } from "@/lib/workspaces";
import type { Bot, ChatMessage, StreamEvent, Workspace } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The public endpoint the embeddable widget talks to. Identified by the bot's
// publicKey — internal ids never leave the server. CORS is open because the
// widget runs on customers' own domains.

const MAX_TOOL_ITERATIONS = 4;
const MAX_HISTORY = 24;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

function send(controller: ReadableStreamDefaultController, enc: TextEncoder, e: StreamEvent) {
  controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
}

export async function POST(req: NextRequest) {
  let body: { botKey?: string; visitorId?: string; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400, headers: CORS });
  }

  let bot: Bot | null;
  let workspace: Workspace | null;
  if (body.botKey === "demo") {
    bot = DEMO_BOT;
    workspace = DEMO_WORKSPACE;
  } else {
    bot = body.botKey ? getBotByKey(body.botKey) : null;
    workspace = bot ? getWorkspace(bot.workspaceId) : null;
  }
  if (!bot || !workspace) {
    return new Response("Unknown bot", { status: 404, headers: CORS });
  }

  const history: ChatMessage[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-MAX_HISTORY);
  if (history.length === 0 || history[history.length - 1]?.role !== "user") {
    return new Response("Expected a user message", { status: 400, headers: CORS });
  }

  const visitorId = (typeof body.visitorId === "string" && body.visitorId.slice(0, 64)) || "anon";
  const enc = new TextEncoder();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const isDemo = bot.id === "demo";

  // Meter every visitor message against the workspace's plan (demo excluded).
  if (!isDemo) {
    const status = planStatus(workspace);
    if (status.overLimit) {
      // Visitor-facing: degrade politely instead of erroring.
      return streamOnce(
        enc,
        `Thanks for your message! Our chat assistant is briefly offline — please email us directly and we'll get right back to you.`,
      );
    }
    recordMessage(workspace.id);
  }

  const finalBot = bot;
  const finalWorkspace = workspace;

  const stream = new ReadableStream({
    async start(controller) {
      let assistantText = "";
      const captureText = (t: string) => {
        assistantText += t;
        send(controller, enc, { type: "text", text: t });
      };
      try {
        if (!hasKey) {
          const turn = fallbackBotReply(history, finalBot, finalWorkspace);
          if (turn.tool) send(controller, enc, { type: "tool", name: "capture_lead", label: turn.tool.label });
          const words = turn.text.split(" ");
          for (let i = 0; i < words.length; i++) {
            captureText((i === 0 ? "" : " ") + words[i]);
            await new Promise((r) => setTimeout(r, 16));
          }
          send(controller, enc, { type: "done", mode: "fallback" });
        } else {
          await runLive(controller, enc, history, finalBot, finalWorkspace, captureText);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        send(controller, enc, { type: "error", message });
        send(controller, enc, { type: "done", mode: hasKey ? "live" : "fallback" });
      } finally {
        try {
          logConversation({
            botId: finalBot.id,
            workspaceId: finalWorkspace.id,
            visitorId,
            transcript: [...history, { role: "assistant", content: assistantText }],
          });
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS,
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

async function runLive(
  controller: ReadableStreamDefaultController,
  enc: TextEncoder,
  history: ChatMessage[],
  bot: Bot,
  workspace: Workspace,
  captureText: (t: string) => void,
) {
  const client = new Anthropic();
  const system = buildBotSystemPrompt(bot, workspace);
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const ms = client.messages.stream({
      model: MODEL,
      max_tokens: 700,
      system,
      tools: BOT_TOOLS,
      messages,
    });

    ms.on("text", captureText);

    const final = await ms.finalMessage();
    messages.push({ role: "assistant", content: final.content });

    if (final.stop_reason !== "tool_use") break;

    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const { result, label } = runBotTool(tu.name, (tu.input ?? {}) as Record<string, unknown>, bot);
      if (label) send(controller, enc, { type: "tool", name: tu.name, label });
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  send(controller, enc, { type: "done", mode: "live" });
}

/** Streams one fixed sentence as NDJSON (used for the over-limit path). */
function streamOnce(enc: TextEncoder, text: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      send(controller, enc, { type: "text", text });
      send(controller, enc, { type: "done", mode: "fallback" });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { ...CORS, "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}
