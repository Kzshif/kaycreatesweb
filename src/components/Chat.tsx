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
  "I'd like to book a check-up for next week.",
  "What are your hours, and do you take Denplan?",
  "I've cracked a tooth and it really hurts.",
  "Can you take a message for the accounts team?",
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
                  ? "border-cyan/50 bg-cyan/10 text-white shadow-glow"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25"
              }`}
            >
              <span className="text-xl">{v.emoji}</span>
              <span>
                <span className="block font-semibold">{v.practice}</span>
                <span className="block text-xs text-slate-400">{v.label}</span>
              </span>
            </button>
          ))}
        </div>
        <Link
          href="/dashboard"
          className="block rounded-xl border border-dashed border-cyan/40 bg-cyan/5 px-3.5 py-3 text-sm font-medium text-cyan-soft hover:bg-cyan/10"
        >
          📋 Open the staff dashboard →
        </Link>
      </aside>

      {/* Chat panel */}
      <div className="card flex h-[68vh] min-h-[520px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan to-iris text-night">
              {vertical.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Robin · {vertical.practice}</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_2px_rgba(62,240,224,0.7)]" /> Online
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
              <div className="rounded-2xl rounded-tl-sm border border-cyan/20 bg-cyan/10 px-4 py-3 text-cyan">
                <span className="dot inline-block">•</span>
                <span className="dot inline-block">•</span>
                <span className="dot inline-block">•</span>
              </div>
            </div>
          )}
        </div>

        {turns.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={busy}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan/50 hover:text-cyan disabled:opacity-50"
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
          className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type as if you're ringing the front desk…"
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan/60"
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
          isRobin
            ? "rounded-tl-sm border border-cyan/15 bg-cyan/10 text-slate-100"
            : "rounded-tr-sm bg-white/10 text-white"
        }`}
      >
        {turn.content || (turn.streaming ? "" : "…")}
        {turn.streaming && <span className="ml-0.5 inline-block animate-pulse text-cyan">▋</span>}
      </div>
      {turn.tools?.map((tool, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-lg border border-iris/25 bg-iris/15 px-2.5 py-1 text-xs font-medium text-iris-soft"
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
        className="rounded-full border border-amber-accent/30 bg-amber-accent/15 px-2.5 py-1 text-xs font-medium text-amber-accent"
      >
        demo mode
      </span>
    );
  }
  if (mode === "live") {
    return (
      <span className="rounded-full border border-cyan/30 bg-cyan/15 px-2.5 py-1 text-xs font-medium text-cyan">
        Claude · live
      </span>
    );
  }
  return null;
}
