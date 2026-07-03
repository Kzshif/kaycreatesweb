import Link from "next/link";
import Script from "next/script";
import NeuralField from "@/components/NeuralField";
import { Counter, Reveal } from "@/components/Motion";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

// The Night surface — Voltage Editorial (docs/design-philosophy.md).

const PLATFORMS = ["WordPress", "Shopify", "Squarespace", "Wix", "Webflow", "Framer", "Custom code"];

const STEPS = [
  {
    n: "01",
    title: "Tell it your business",
    body: "Paste in what you offer, your prices, your policies — anything a great employee would know. Five minutes, no training data required.",
  },
  {
    n: "02",
    title: "Paste one line of code",
    body: "One script tag on any platform. The chat bubble appears instantly, in your color, speaking in your voice.",
  },
  {
    n: "03",
    title: "Wake up to leads",
    body: "It answers visitors 24/7 and captures names and emails into your inbox — with AI-drafted replies ready to send.",
  },
];

const CHATBOT_FEATURES = [
  {
    title: "Answers 24/7",
    body: "Visitors get instant answers about your services, pricing, and policies — at 2pm or 2am, while you're with customers or asleep.",
  },
  {
    title: "Captures every lead",
    body: "When a visitor shows interest, it warmly collects their name and email. The lead is in your inbox before they close the tab.",
  },
  {
    title: "Sounds like you",
    body: "Your name, tone, colors, and goal. It answers only from your business information — it never invents prices or policies.",
  },
  {
    title: "Drafts the follow-up",
    body: "One click turns any captured lead into a ready-to-send reply, written in your voice by AI.",
  },
];

const SEO_CHECKS = [
  ["Title tag", "pass"],
  ["Meta description", "pass"],
  ["H1 heading", "pass"],
  ["Content depth", "warn"],
  ["Mobile viewport", "pass"],
  ["Internal links", "warn"],
] as const;

const PLANS = [
  {
    id: "launch",
    name: "Launch",
    price: 29,
    tagline: "One site, getting started",
    features: [
      "1 AI chatbot",
      "500 chat messages / mo",
      "Lead capture inbox",
      "5 SEO audits / mo",
      "AI meta & keyword generator",
    ],
    highlight: false,
  },
  {
    id: "grow",
    name: "Grow",
    price: 79,
    tagline: "Serious about turning visitors into customers",
    features: [
      "3 AI chatbots",
      "3,000 chat messages / mo",
      "Everything in Launch",
      "Unlimited SEO audits",
      "AI blog & landing-page writer",
      "AI weekly pulse briefing",
      "AI-drafted lead replies",
    ],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 199,
    tagline: "Agencies & multi-site businesses",
    features: [
      "10 AI chatbots",
      "15,000 chat messages / mo",
      "Everything in Grow",
      "Remove KayCreatesWeb branding",
      "Priority support",
    ],
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="bg-night text-silver">
      <SiteHeader />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <NeuralField opacity={0.95} />
        {/* Vignette so type sits on quiet dark */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 520px at 50% 18%, rgba(9,11,18,0) 0%, rgba(9,11,18,0.55) 62%, #090b12 100%)",
          }}
        />
        <div className="container-x relative grid gap-14 pb-20 pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-48">
          <div>
            <Reveal>
              <p className="eyebrow-night mb-5">AI chatbots + SEO · any website</p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Your website,
                <br />
                finally{" "}
                <em className="serif-accent grad-text pr-1 text-[1.08em]">working</em>
                <br />
                for you.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-silver/65">
                An AI assistant that answers visitors and captures leads around the
                clock — and an SEO studio that tells you exactly how to get found.
                One script tag. Any platform.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="btn-volt px-7 py-3.5 text-base">
                  Start your free trial →
                </Link>
                <span className="text-sm text-silver/45">
                  or try the live demo — bottom-right corner ↘
                </span>
              </div>
            </Reveal>
          </div>

          {/* Hero conversation — charged glass, floating */}
          <Reveal delay={200}>
            <div className="glass float-slow relative p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="pulse-ring grid h-11 w-11 place-items-center rounded-full text-night"
                  style={{ background: "linear-gradient(120deg, #5c7cfa, #22d3ee)" }}
                >
                  💬
                </span>
                <div>
                  <p className="text-sm font-semibold">Visitor on kaysdesignstudio.com · 11:42 PM</p>
                  <p className="text-xs text-silver/45">Answered in 0.6s</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <Bubble who="visitor">Do you build websites for restaurants? Rough price?</Bubble>
                <Bubble who="bot">
                  We do! Restaurant sites with menus and online ordering start at $1,800
                  and take about 3 weeks. Want me to have Kay send you a detailed quote?
                </Bubble>
                <Bubble who="visitor">Yes please — mia@trattoriamia.com</Bubble>
                <Bubble who="bot">
                  Perfect, Mia! I've passed your details along — you'll hear from Kay
                  first thing tomorrow. 🎉
                </Bubble>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-live/20 bg-live/[0.07] px-3 py-2.5 text-xs font-medium text-live">
                <span>★</span> Lead captured · mia@trattoriamia.com · AI reply drafted
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- Platform marquee */}
      <section className="border-y border-white/[0.07] py-5" aria-label="Works with any platform">
        <div className="relative overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span
                key={i}
                className="font-display text-sm font-medium uppercase tracking-[0.28em] text-silver/35"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-night to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-night to-transparent" />
        </div>
      </section>

      {/* ------------------------------------------------------------- Stat band */}
      <section className="container-x grid gap-10 py-20 sm:grid-cols-3">
        {[
          { value: 38, suffix: "%", label: "of visitors leave when they can't find an answer fast" },
          { value: 24, suffix: "/7", label: "answering and lead capture, in your voice" },
          { value: 5, prefix: "< ", suffix: " min", label: "from signup to live on your website" },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 100}>
            <div className="border-l border-white/10 pl-6">
              <p className="font-display text-5xl font-semibold tracking-tight">
                <Counter to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix} className="grad-text" />
              </p>
              <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-silver/55">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ------------------------------------------------------------ How it works */}
      <section id="how" className="container-x pb-24">
        <Reveal>
          <p className="eyebrow-night mb-4">How it works</p>
          <h2 className="max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Live on your site in{" "}
            <em className="serif-accent grad-text">minutes.</em>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="glass h-full p-7">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-night"
                  style={{ background: "linear-gradient(120deg, #5c7cfa, #22d3ee)" }}
                >
                  {s.n}
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-silver/60">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Chatbot pillar */}
      <section id="chatbot" className="relative overflow-hidden border-y border-white/[0.07] py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 400px at 15% 0%, rgba(76,110,245,0.12), transparent 60%)",
          }}
        />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow-night mb-4">Pillar one · the chatbot</p>
            <h2 className="max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              An employee who{" "}
              <em className="serif-accent grad-text">never sleeps,</em> on every page.
            </h2>
            <p className="mt-4 max-w-2xl text-silver/60">
              Answering the phone was yesterday's problem. Today your customers are on
              your website at midnight — and they won't wait for the morning.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CHATBOT_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="glass h-full p-6">
                  <span className="grad-text font-display text-2xl font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver/60">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-10 text-sm text-silver/50">
              👉 The bubble in the corner of this page <em className="serif-accent text-silver/80">is</em>{" "}
              the product — go ask it something.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------------- SEO pillar */}
      <section id="seo" className="container-x grid items-center gap-14 py-24 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow-night mb-4">Pillar two · SEO Studio</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            A chatbot can't help visitors who{" "}
            <em className="serif-accent grad-text">never arrive.</em>
          </h2>
          <p className="mt-4 max-w-xl text-silver/60">
            The SEO Studio audits any page the way a consultant would — ten checks, a
            0–100 score, and an AI action plan with rewritten titles and descriptions
            ready to paste. Then the AI writer produces the content: keywords,
            metadata, full blog posts, written for your business.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-silver/70">
            {[
              "0–100 score across ten on-page checks",
              "Prioritized fixes written for your page, not a generic checklist",
              "Titles, meta descriptions, keywords & full posts on demand",
            ].map((li) => (
              <li key={li} className="flex gap-3">
                <span className="grad-text font-bold">→</span> {li}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Audit mock — charged glass artifact */}
        <Reveal delay={150}>
          <div className="glass p-7">
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#seoGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${0.86 * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                  />
                  <defs>
                    <linearGradient id="seoGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#5c7cfa" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 grid place-items-center font-display text-3xl font-bold">
                  <Counter to={86} />
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">kaysdesignstudio.com</p>
                <p className="text-xs text-silver/45">audited just now</p>
                <span className="mt-2 inline-block rounded-full border border-live/25 bg-live/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-live">
                  AI action plan · Claude
                </span>
              </div>
            </div>
            <ul className="mt-6 space-y-2.5">
              {SEO_CHECKS.map(([label, status]) => (
                <li key={label} className="flex items-center justify-between text-sm">
                  <span className="text-silver/70">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      status === "pass"
                        ? "bg-live/10 text-live"
                        : "bg-filament/10 text-filament"
                    }`}
                  >
                    {status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/[0.07] pt-4 text-xs leading-relaxed text-silver/50">
              <span className="grad-text font-semibold">1.</span> Expand the services section to
              400+ words — your competitors rank with deeper pages. ·{" "}
              <span className="grad-text font-semibold">2.</span> Add internal links from your
              three portfolio pages…
            </p>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ Pricing */}
      <section id="pricing" className="relative overflow-hidden border-t border-white/[0.07] py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 85% 100%, rgba(34,211,238,0.08), transparent 60%)",
          }}
        />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow-night mb-4">Pricing</p>
            <h2 className="max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Pays for itself with{" "}
              <em className="serif-accent grad-text">one lead.</em>
            </h2>
            <p className="mt-4 text-silver/60">
              Every plan starts with a 14-day free trial — no credit card. Cancel anytime.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <div
                  className={`glass relative h-full p-8 ${p.highlight ? "!border-volt/50" : ""}`}
                  style={
                    p.highlight
                      ? { boxShadow: "0 0 0 1px rgba(76,110,245,0.35), 0 24px 80px -32px rgba(76,110,245,0.5)" }
                      : undefined
                  }
                >
                  {p.highlight && (
                    <span
                      className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-night"
                      style={{ background: "linear-gradient(120deg, #5c7cfa, #22d3ee)" }}
                    >
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-silver/50">{p.tagline}</p>
                  <p className="mt-6 font-display text-5xl font-semibold tracking-tight">
                    <span className="align-top text-2xl text-silver/60">$</span>
                    {p.price}
                    <span className="font-serif text-lg italic text-silver/45"> / month</span>
                  </p>
                  <ul className="mt-7 space-y-3 text-sm text-silver/70">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <span className="grad-text font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`${p.highlight ? "btn-volt" : "btn-night-ghost"} mt-8 w-full`}
                  >
                    Start free trial
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Final CTA */}
      <section className="relative overflow-hidden py-28">
        <NeuralField seed={777} density={80} opacity={0.7} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 460px at 50% 50%, rgba(9,11,18,0.1) 0%, rgba(9,11,18,0.8) 72%, #090b12 100%)",
          }}
        />
        <div className="container-x relative text-center">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              Your next customer is on your site{" "}
              <em className="serif-accent grad-text">right now.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-silver/60">
              Five minutes to set up. Stop losing the visitors you already paid to attract.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="btn-volt px-8 py-4 text-base">
                Start your free trial →
              </Link>
              <span className="self-center text-sm text-silver/45">or ask the demo bot ↘</span>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />

      {/* Dogfood: the landing page runs the actual embeddable widget. */}
      <Script src="/widget.js" data-bot="demo" strategy="lazyOnload" />
    </div>
  );
}

function Bubble({ who, children }: { who: "visitor" | "bot"; children: React.ReactNode }) {
  const isBot = who === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-snug ${
          isBot
            ? "rounded-tl-sm border border-white/[0.08] bg-white/[0.06] text-silver/90"
            : "rounded-tr-sm bg-gradient-to-br from-volt-bright to-live text-night"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
