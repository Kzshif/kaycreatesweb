"use client";

import { useState } from "react";

// The hero ask-bar: type a question, and the actual embedded widget (bottom
// right) opens and answers it live. The most honest demo there is.

declare global {
  interface Window {
    __novaAsk?: (text: string) => void;
  }
}

const PROMPTS = ["How does the chatbot work?", "What does it cost?", "Can it capture leads?"];

export default function AskNova() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    setValue("");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    // The widget loads lazily — retry briefly until its API is up.
    const start = Date.now();
    const attempt = () => {
      if (window.__novaAsk) {
        window.__novaAsk(q);
      } else if (Date.now() - start < 6000) {
        setTimeout(attempt, 250);
      }
    };
    attempt();
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(value);
        }}
        className="glass flex items-center gap-2 !rounded-full p-1.5 pl-5"
      >
        <span className="grad-text font-display text-lg" aria-hidden>
          ✦
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask our AI anything — it answers live on this page…"
          className="min-w-0 flex-1 bg-transparent text-sm text-starlight outline-none placeholder:text-starlight/40"
          aria-label="Ask the AI a question"
        />
        <button type="submit" className="btn-nova !px-5 !py-2.5 text-sm">
          {sent ? "Sent ↘" : "Ask"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => ask(p)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-starlight/60 transition hover:border-nova/60 hover:text-starlight"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
