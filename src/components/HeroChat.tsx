"use client";

import { useEffect, useRef, useState } from "react";

// The living hero demo: the conversation types itself, message by message,
// with typing dots before each bot reply and a lead-captured chip at the end —
// then loops. Under prefers-reduced-motion it renders the full conversation
// statically.

interface Line {
  who: "visitor" | "bot";
  text: string;
}

const SCRIPT: Line[] = [
  { who: "visitor", text: "Do you do private events? Rough price for 30 people?" },
  {
    who: "bot",
    text: "We'd love to host you! Private dinners for 30 start around £1,400 with a set menu. Want me to have the events team send you the full options?",
  },
  { who: "visitor", text: "Yes please — mia@example.com" },
  { who: "bot", text: "Perfect, Mia! You'll hear from the team first thing tomorrow. 🎉" },
];

type Phase = { line: number; chars: number; dots: boolean; chip: boolean };

export default function HeroChat({ light = false }: { light?: boolean }) {
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>({ line: 0, chars: 0, dots: false, chip: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      return;
    }

    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timer.current = setTimeout(r, ms);
      });

    async function run() {
      while (!cancelled) {
        setPhase({ line: 0, chars: 0, dots: false, chip: false });
        await wait(900);
        for (let i = 0; i < SCRIPT.length && !cancelled; i++) {
          const line = SCRIPT[i];
          if (line.who === "bot") {
            setPhase({ line: i, chars: 0, dots: true, chip: false });
            await wait(850);
          }
          // type it out
          const step = line.who === "bot" ? 14 : 22;
          for (let c = 1; c <= line.text.length && !cancelled; c += 3) {
            setPhase({ line: i, chars: c, dots: false, chip: false });
            await wait(step);
          }
          setPhase({ line: i, chars: line.text.length, dots: false, chip: false });
          await wait(line.who === "visitor" ? 500 : 700);
        }
        if (cancelled) break;
        setPhase({ line: SCRIPT.length, chars: 0, dots: false, chip: true });
        await wait(4200);
      }
    }
    run();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const visible = reduced ? SCRIPT.length : phase.line;
  const chipOn = reduced || phase.chip;

  return (
    <div
      className={`relative rounded-2xl p-6 sm:p-7 ${
        light
          ? "border border-ink/10 bg-white shadow-[0_24px_64px_-32px_rgba(26,33,66,0.35)]"
          : "glass"
      }`}
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="pulse-ring grid h-11 w-11 place-items-center rounded-full font-display font-bold text-white"
          style={{ background: "linear-gradient(120deg, #a855f7, #22d3ee)" }}
        >
          ✦
        </span>
        <div>
          <p className={`text-sm font-semibold ${light ? "text-ink" : ""}`}>Visitor on trattoriamia.com · 11:42 PM</p>
          <p className={`text-xs ${light ? "text-ink/45" : "text-starlight/45"}`}>Answered in 0.6s</p>
        </div>
      </div>

      <div className="min-h-[280px] space-y-3 text-sm sm:min-h-[300px]">
        {SCRIPT.map((line, i) => {
          if (!reduced && i > phase.line) return null;
          const full = reduced || i < phase.line;
          const text = full ? line.text : line.text.slice(0, phase.chars);
          if (!full && phase.dots && line.who === "bot" && i === phase.line) {
            return (
              <div key={i} className="flex justify-start">
                <p className={`rounded-2xl rounded-tl-sm border px-3.5 py-2.5 ${light ? "border-ink/10 bg-ink/[0.04]" : "border-white/[0.08] bg-white/[0.06]"}`}>
                  <span className="dot inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />{" "}
                  <span className="dot inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />{" "}
                  <span className="dot inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                </p>
              </div>
            );
          }
          if (!text) return null;
          const isBot = line.who === "bot";
          return (
            <div key={i} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
              <p
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-snug ${
                  isBot
                    ? light
                      ? "rounded-tl-sm border border-ink/10 bg-ink/[0.04] text-ink/90"
                      : "rounded-tl-sm border border-white/[0.08] bg-white/[0.06] text-starlight/90"
                    : "rounded-tr-sm bg-gradient-to-br from-nova to-stellar text-white"
                }`}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className={`mt-5 flex items-center gap-2 rounded-xl border border-nova/25 bg-nova/[0.08] px-3 py-2.5 text-xs font-medium text-nova transition-all duration-500 ${
          chipOn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span>★</span> Lead captured · mia@example.com · AI reply drafted
      </div>
    </div>
  );
}
