"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VERTICAL_LIST, getVertical } from "@/lib/verticals";
import type { StreamEvent, VerticalId } from "@/lib/types";

interface ToolChip {
  label: string;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  tools?: ToolChip[];
  streaming?: boolean;
}

const SUGGESTIONS = [
  "I'd like to book a cleaning for next week.",
  "What are your hours and do you take Delta Dental?",
  "I cracked a tooth and it really hurts.",
  "Can you take a message for the billing department?",
];

export default function Chat({ initialVertical }: { initialVertical?: string }) {
  const [verticalId, setVerticalId] = useState<VerticalId>(
    getVertical(initialVertical).id,
  );
  const vertical = getVertical(verticalId);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "fallback" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset the conversation whenever the vertical changes.
  useEffect(() => {
    setTurns([{ role: "assistant", content: vertical.greeting }]);
    setMode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verticalId]);

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

    const wireMessages = history.map((t) => ({ role: t.role, content: t.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: wireMessages, vertical: verticalId }),
      });
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
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Vertical switcher */}
      <aside className="space-y-3">
        <p className="eyebrow">Choose a practice</p>
        <div className="space-y-2">
          {VERTICAL_LIST.map((v) => (
            <button
              key={v.id}
              onClick={() => setVerticalId(v.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition ${
                v.id === verticalId
                  ? "border-teal bg-teal/10 text-ink"
                  : "border-ink/10 bg-white/60 text-ink/70 hover:border-ink/30"
              }`}
            >
              <span className="text-xl">{v.emoji}</span>
              <span>
                <span className="block font-semibold">{v.practice}</span>
                <span className="block text-xs text-ink/50">{v.label}</span>
              </span>
            </button>
          ))}
        </div>
        <Link
          href="/dashboard"
          className="block rounded-xl border border-dashed border-teal/40 bg-teal/5 px-3.5 py-3 text-sm font-medium text-teal-deep hover:bg-teal/10"
        >
          📋 Open the staff dashboard →
        </Link>
      </aside>

      {/* Chat panel */}
      <div className="card flex h-[68vh] min-h-[520px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-cream">
              {vertical.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold">Robin · {vertical.practice}</p>
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
              <div className="rounded-2xl rounded-tl-sm bg-teal/10 px-4 py-3">
                <span className="dot inline-block">•</span>
                <span className="dot inline-block">•</span>
                <span className="dot inline-block">•</span>
              </div>
            </div>
          )}
        </div>

        {turns.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-ink/10 px-5 py-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={busy}
                className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/70 transition hover:border-teal hover:text-teal disabled:opacity-50"
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
            placeholder="Type as if you're calling the front desk…"
            className="flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn-primary disabled:opacity-50">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ turn }: { turn: Turn }) {
  const isRobin = turn.role === "assistant";
  return (
    <div className={`flex flex-col gap-1.5 ${isRobin ? "items-start" : "items-end"}`}>
      <div
        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isRobin ? "rounded-tl-sm bg-teal/10 text-ink" : "rounded-tr-sm bg-ink text-cream"
        }`}
      >
        {turn.content || (turn.streaming ? "" : "…")}
        {turn.streaming && <span className="ml-0.5 inline-block animate-pulse">▋</span>}
      </div>
      {turn.tools?.map((tool, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-lg bg-amber-accent/15 px-2.5 py-1 text-xs font-medium text-ink/75"
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
        title="ANTHROPIC_API_KEY is not set, so this uses a scripted rule-based receptionist."
        className="rounded-full bg-amber-accent/15 px-2.5 py-1 text-xs font-medium text-amber-accent"
      >
        demo mode
      </span>
    );
  }
  if (mode === "live") {
    return (
      <span className="rounded-full bg-teal/15 px-2.5 py-1 text-xs font-medium text-teal">
        Claude · live
      </span>
    );
  }
  return null;
}
