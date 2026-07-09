"use client";

import { useState } from "react";
import { WarpLink } from "./Warp";

// The Mission Readiness Scan: a 2-minute game that tells a business what
// their website is missing — and captures their details so the NOVA05 crew
// can follow up. Completions post to the Netlify form "quiz-leads"
// (dashboard list + email notification to the owner).

interface Q {
  id: string;
  prompt: string;
  options: { label: string; emoji: string; tag: Tag }[];
}
type Tag = "receptionist" | "chatbot" | "website" | "seo";

const QUESTIONS: Q[] = [
  {
    id: "q1",
    prompt: "What kind of ship are you flying?",
    options: [
      { label: "Restaurant, café, or food", emoji: "🍜", tag: "chatbot" },
      { label: "Clinic, salon, or anything with appointments", emoji: "📅", tag: "receptionist" },
      { label: "Trades or home services", emoji: "🔧", tag: "receptionist" },
      { label: "Shop, studio, or something else", emoji: "🛍️", tag: "chatbot" },
    ],
  },
  {
    id: "q2",
    prompt: "How's the current website feeling?",
    options: [
      { label: "What website? 😅", emoji: "🚧", tag: "website" },
      { label: "It exists… since 2016", emoji: "🦖", tag: "website" },
      { label: "Looks fine, but it's silent — no enquiries", emoji: "🤫", tag: "chatbot" },
      { label: "Pretty good — I want more from it", emoji: "🚀", tag: "seo" },
    ],
  },
  {
    id: "q3",
    prompt: "A customer has a question at 9pm. What happens?",
    options: [
      { label: "Nothing until morning", emoji: "🌙", tag: "receptionist" },
      { label: "I answer from my sofa/bed (again)", emoji: "🛋️", tag: "chatbot" },
      { label: "They phone — and we miss it", emoji: "📞", tag: "receptionist" },
      { label: "We answer instantly, actually", emoji: "⚡", tag: "seo" },
    ],
  },
  {
    id: "q4",
    prompt: "Pick the mission objective:",
    options: [
      { label: "More enquiries and bookings", emoji: "📈", tag: "receptionist" },
      { label: "Look properly professional", emoji: "✨", tag: "website" },
      { label: "Actually show up on Google", emoji: "🔭", tag: "seo" },
      { label: "Stop answering the same 10 questions", emoji: "🔁", tag: "chatbot" },
    ],
  },
  {
    id: "q5",
    prompt: "A robot takes ONE job off your plate tomorrow. Which?",
    options: [
      { label: "Answering customer questions", emoji: "💬", tag: "chatbot" },
      { label: "Catching and chasing leads", emoji: "🎣", tag: "receptionist" },
      { label: "Writing the website words", emoji: "✍️", tag: "seo" },
      { label: "Building the whole website", emoji: "🏗️", tag: "website" },
    ],
  },
];

const RESULTS: Record<Tag, { title: string; emoji: string; blurb: string; href: string; cta: string }> = {
  receptionist: {
    title: "The Overbooked Owl",
    emoji: "🦉",
    blurb:
      "Your business runs on enquiries you're too busy to catch. An AI receptionist on your site would greet, answer, and capture bookings — especially the 9pm ones you're currently losing.",
    href: "/receptionist",
    cta: "Meet your AI receptionist →",
  },
  chatbot: {
    title: "The Question Magnet",
    emoji: "🧲",
    blurb:
      "People clearly want to talk to you — you're just answering everything by hand. An AI chatbot trained on your business answers instantly, 24/7, and hands you the warm leads.",
    href: "/chatbot",
    cta: "Meet your AI chatbot →",
  },
  website: {
    title: "The Rocket Still in the Garage",
    emoji: "🚀",
    blurb:
      "The engine's ready — the ship isn't. A modern site with the AI pre-installed would put you miles ahead of the competitors still running brochure pages.",
    href: "/websites",
    cta: "See the website studio →",
  },
  seo: {
    title: "The Hidden Gem",
    emoji: "💎",
    blurb:
      "You're doing the work; Google just doesn't know it yet. An SEO tune-up plus AI-written content would put you in front of the people already searching for you.",
    href: "/seo",
    cta: "Enter the SEO studio →",
  },
};

export default function Quiz() {
  const [step, setStep] = useState(0); // 0..4 questions, 5 contact, 6 result
  const [answers, setAnswers] = useState<{ label: string; tag: Tag }[]>([]);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = QUESTIONS.length;
  const progress = Math.min(step, total) / total;

  function pick(label: string, tag: Tag) {
    const next = [...answers];
    next[step] = { label, tag };
    setAnswers(next);
    setStep(step + 1);
  }

  function archetype(): Tag {
    const counts = new Map<Tag, number>();
    for (const a of answers) counts.set(a.tag, (counts.get(a.tag) ?? 0) + 1);
    let best: Tag = "chatbot";
    let bestN = -1;
    for (const [tag, n] of counts) if (n > bestN) [best, bestN] = [tag, n];
    return best;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const tag = archetype();
    const body = new URLSearchParams({
      "form-name": "quiz-leads",
      name,
      email,
      business,
      archetype: RESULTS[tag].title,
      ...Object.fromEntries(answers.map((a, i) => [`q${i + 1}`, a.label])),
    });
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStep(total + 1);
    } catch {
      setError("Transmission hiccup — try once more?");
    } finally {
      setSending(false);
    }
  }

  const r = RESULTS[archetype()];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress rail */}
      {step <= total && (
        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(6, progress * 100)}%`,
              background: "linear-gradient(90deg, #ffb454, #f06595)",
            }}
          />
        </div>
      )}

      {step < total && (
        <div key={step} className="warp-arrive">
          <p className="eyebrow-space mb-3">
            Scan {step + 1} of {total}
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {QUESTIONS[step].prompt}
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {QUESTIONS[step].options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => pick(o.label, o.tag)}
                className="quiz-option"
              >
                <span className="mr-2 text-xl">{o.emoji}</span> {o.label}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mt-6 text-sm text-starlight/40 transition hover:text-starlight"
            >
              ← back
            </button>
          )}
        </div>
      )}

      {step === total && (
        <form onSubmit={submit} className="warp-arrive">
          <p className="eyebrow-space mb-3">Scan complete</p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Where should we send your{" "}
            <em className="serif-accent grad-text font-normal">flight plan?</em>
          </h2>
          <p className="mt-3 text-sm text-starlight/55">
            Your result appears instantly — and the crew will follow up with a short,
            personal plan for your business. No spam, ever.
          </p>
          <div className="mt-7 space-y-4">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-starlight placeholder:text-starlight/30 focus:border-nova/60 focus:outline-none"
            />
            <input
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="Business name (optional)"
              className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-starlight placeholder:text-starlight/30 focus:border-nova/60 focus:outline-none"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-starlight placeholder:text-starlight/30 focus:border-nova/60 focus:outline-none"
            />
            {error && <p className="text-sm text-nebula">{error}</p>}
            <button type="submit" disabled={sending} className="btn-nova w-full justify-center disabled:opacity-60">
              {sending ? "Transmitting…" : "Reveal my result ✦"}
            </button>
          </div>
        </form>
      )}

      {step === total + 1 && (
        <div className="warp-arrive text-center">
          <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full text-5xl"
            style={{ background: "linear-gradient(135deg, rgba(255,180,84,0.25), rgba(240,101,149,0.25))" }}
          >
            {r.emoji}
          </div>
          <p className="eyebrow-space mb-2">Your archetype</p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{r.title}</h2>
          <p className="mx-auto mt-4 max-w-lg leading-relaxed text-starlight/65">{r.blurb}</p>
          <p className="mt-4 text-sm text-starlight/45">
            📡 Flight plan received{name ? `, ${name.split(" ")[0]}` : ""} — the crew will
            be in touch shortly.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <WarpLink href={r.href} className="btn-nova">
              {r.cta}
            </WarpLink>
            <WarpLink href="/pricing" className="btn-space-ghost">
              See pricing
            </WarpLink>
          </div>
        </div>
      )}
    </div>
  );
}
