"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamEvent } from "@/lib/types";

// Shared streaming chat client for the NDJSON endpoints (the bot preview
// against /api/widget/chat). Renders text deltas, tool chips, and the
// live/fallback mode badge.

interface ToolChip {
  label: string;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  tools?: ToolChip[];
  streaming?: boolean;
}

export default function StreamChat({
  endpoint,
  body = {},
  greeting,
  suggestions,
  placeholder,
  persona,
}: {
  endpoint: string;
  body?: Record<string, unknown>;
  greeting: string;
  suggestions: string[];
  placeholder: string;
  persona: { name: string; emoji: string };
}) {
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "fallback" | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  async function send(message: string) {
    const text = message.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);

    const history = [...turns, { role: "user" as const, content: text }];
    setTurns([...history, { role: "assistant", content: "", streaming: true }]);

    const wireMessages = history
      .slice(1) // drop the local greeting
      .map((t) => ({ role: t.role, content: t.content }));

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, messages: wireMessages }),
      });
      if (res.status === 402) {
        const json = await res.json().catch(() => ({}));
        setBlocked(json.error ?? "Plan limit reached.");
        setTurns(history);
        setBusy(false);
        return;
      }
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          applyEvent(evt);
        }
        return pump();
      };
      await pump();
    } catch (err) {
      applyEvent({
        type: "error",
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setTurns((prev) =>
        prev.map((t, i) => (i === prev.length - 1 ? { ...t, streaming: false } : t)),
      );
      setBusy(false);
    }
  }

  function applyEvent(evt: StreamEvent) {
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last || last.role !== "assistant") return prev;
      if (evt.type === "text") {
        last.content += evt.text;
      } else if (evt.type === "tool") {
        last.tools = [...(last.tools ?? []), { label: evt.label }];
      } else if (evt.type === "error") {
        last.content += (last.content ? "\n\n" : "") + `⚠️ ${evt.message}`;
      }
      return next;
    });
    if (evt.type === "done") setMode(evt.mode);
  }

  return (
    <div className="card flex h-[66vh] min-h-[500px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-paper">
            {persona.emoji}
          </span>
          <div>
            <p className="text-sm font-semibold">{persona.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-ink/50">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Online
            </p>
          </div>
        </div>
        <ModeBadge mode={mode} />
      </div>

      <div ref={scrollRef} className="scroll-thin flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {turns.map((t, i) => (
          <Message key={i} turn={t} />
        ))}
        {busy && turns[turns.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-primary/10 px-4 py-3">
              <span className="dot inline-block">•</span>
              <span className="dot inline-block">•</span>
              <span className="dot inline-block">•</span>
            </div>
          </div>
        )}
      </div>

      {blocked && (
        <div className="border-t border-accent/30 bg-accent/10 px-5 py-3 text-sm text-ink/80">
          {blocked}{" "}
          <a href="/app/billing" className="font-semibold text-primary hover:underline">
            View plans →
          </a>
        </div>
      )}

      {turns.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-ink/10 px-5 py-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/70 transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-ink/10 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}

function Message({ turn }: { turn: Turn }) {
  const isAssistant = turn.role === "assistant";
  return (
    <div className={`flex flex-col gap-1.5 ${isAssistant ? "items-start" : "items-end"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAssistant ? "rounded-tl-sm bg-primary/10 text-ink" : "rounded-tr-sm bg-ink text-paper"
        }`}
      >
        {turn.content || (turn.streaming ? "" : "…")}
        {turn.streaming && <span className="ml-0.5 inline-block animate-pulse">▋</span>}
      </div>
      {turn.tools?.map((tool, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-medium text-ink/75"
        >
          {tool.label}
        </div>
      ))}
    </div>
  );
}

function ModeBadge({ mode }: { mode: "live" | "fallback" | null }) {
  if (mode === "fallback") {
    return (
      <span
        title="ANTHROPIC_API_KEY is not set, so this runs in scripted demo mode."
        className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent"
      >
        demo mode
      </span>
    );
  }
  if (mode === "live") {
    return (
      <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
        Claude · live
      </span>
    );
  }
  return null;
}
