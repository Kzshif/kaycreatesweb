import Anthropic from "@anthropic-ai/sdk";
import type { Vertical, ChatMessage } from "./types";
import { MODEL, TOOLS, buildSystemPrompt, runTool } from "./receptionist";
import { fallbackReply } from "./fallback";

const MAX_TOOL_ITERATIONS = 6;

export interface ConverseResult {
  text: string;
  mode: "live" | "fallback";
}

// Non-streaming version of the receptionist used by channels that need the full
// reply at once (e.g. the Twilio voice webhook, which speaks it back). The
// streaming chat route runs the same loop but emits deltas as they arrive.
export async function converse(
  history: ChatMessage[],
  vertical: Vertical,
): Promise<ConverseResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { text: fallbackReply(history, vertical).text, mode: "fallback" };
  }

  const client = new Anthropic();
  const system = buildSystemPrompt(vertical);
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let text = "";
  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools: TOOLS,
      messages,
    });

    text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();

    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of res.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    )) {
      const { result } = runTool(tu.name, (tu.input ?? {}) as Record<string, unknown>, vertical);
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { text: text || "I'm sorry, could you repeat that?", mode: "live" };
}
