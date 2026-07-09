import AskNova from "@/components/AskNova";
import { Counter, Reveal } from "@/components/Motion";
import { WarpLink } from "@/components/Warp";

// Mission control — the Deep Space home page (docs/design-philosophy.md).

export const metadata = {
  title: { absolute: "NOVA05 — AI chatbots, receptionists, websites & SEO" },
  description:
    "NOVA05 is one studio for everything your business needs online: an AI chatbot and AI receptionist that answer visitors 24/7 and capture leads, done-for-you website creation, an AI SEO studio that gets you found, and a free QR code studio.",
  alternates: { canonical: "/" },
};

const PLATFORMS = ["WordPress", "Shopify", "Squarespace", "Wix", "Webflow", "Framer", "Custom code"];

const STEPS = [
  {
    n: "01",
    title: "Tell it your business",
    body: "Paste in what you offer, your prices, your policies — anything a great employee would know. Five minutes.",
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

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="container-x relative grid gap-14 pb-24 pt-44 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-52">
        <div>
          <Reveal>
            <p className="eyebrow-space mb-6">NOVA05 · chatbots · receptionists · websites · SEO · QR</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Your site.
              <br />
              Our AI.
              <br />
              <em className="serif-accent grad-text text-[1.12em] font-normal">Liftoff.</em>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-starlight/65">
              An AI assistant that answers your visitors and captures leads around the
              clock, plus an SEO studio that gets you found. One script tag. Any platform.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 max-w-xl">
              <AskNova />
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <WarpLink href="/pricing" className="btn-nova px-7 py-3.5 text-base">
                Start your free trial →
              </WarpLink>
              <span className="text-sm text-starlight/45">14 days free · no credit card</span>
            </div>
          </Reveal>
        </div>

        {/* Hero conversation — void glass, floating */}
        <Reveal delay={200}>
          <div className="glass float-slow relative p-6 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="pulse-ring grid h-11 w-11 place-items-center rounded-full font-display font-bold text-space"
                style={{ background: "linear-gradient(120deg, #ffb454, #f06595)" }}
              >
                ✦
              </span>
              <div>
                <p className="text-sm font-semibold">Visitor on trattoriamia.com · 11:42 PM</p>
                <p className="text-xs text-starlight/45">Answered in 0.6s</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <Bubble who="visitor">Do you do private events? Rough price for 30 people?</Bubble>
              <Bubble who="bot">
                We'd love to host you! Private dinners for 30 start around $1,400 with a
                set menu. Want me to have the events team send you the full options?
              </Bubble>
              <Bubble who="visitor">Yes please — mia@example.com</Bubble>
              <Bubble who="bot">
                Perfect, Mia! You'll hear from the team first thing tomorrow. 🎉
              </Bubble>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-nova/25 bg-nova/[0.08] px-3 py-2.5 text-xs font-medium text-nova">
              <span>★</span> Lead captured · mia@example.com · AI reply drafted
            </div>
          </div>
        </Reveal>
      </section>

      {/* -------------------------------------------------- The five destinations */}
      <section className="container-x pb-24">
        <Reveal>
          <p className="eyebrow-space mb-4">Pick a destination</p>
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One studio. <em className="serif-accent grad-text font-normal">Every orbit.</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <PortalCard
            href="/chatbot"
            delay={0}
            eyebrow="Orbit one"
            title="The AI Chatbot"
            body="An employee who never sleeps, on every page — answering visitors and turning the interested ones into leads while you're busy or asleep."
            cta="Visit the chatbot →"
            emblem="💬"
          />
          <PortalCard
            href="/receptionist"
            delay={90}
            eyebrow="Orbit two"
            title="The AI Receptionist"
            body="Built for booking businesses — dentists, salons, clinics, trades. It greets, answers from your price list, and captures the enquiry at 2am."
            cta="Meet the receptionist →"
            emblem="✦"
          />
          <PortalCard
            href="/websites"
            delay={180}
            eyebrow="Orbit three"
            title="Website Creation"
            body="Done-for-you websites with the AI already inside — designed, written to rank, and answering customers from the day they launch."
            cta="Visit the studio →"
            emblem="🪐"
          />
          <PortalCard
            href="/seo"
            delay={270}
            eyebrow="Orbit four"
            title="The SEO Studio"
            body="A chatbot can't help visitors who never arrive. Audit any page for a 0–100 score, get an AI action plan, and generate content that ranks."
            cta="Enter the studio →"
            emblem="▲"
          />
        </div>
        <Reveal delay={340}>
          <WarpLink href="/qr" className="group mt-6 block">
            <div className="glass flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow-space mb-1.5">Free tool · no signup</p>
                <h3 className="font-display text-xl font-semibold">
                  The QR Studio — brand-colored codes with a nova in the middle
                </h3>
              </div>
              <p className="grad-text text-sm font-bold transition group-hover:translate-x-1">
                Make one free →
              </p>
            </div>
          </WarpLink>
        </Reveal>
      </section>

      {/* --------------------------------------------------------- Platform marquee */}
      <section className="border-y border-white/[0.07] py-5" aria-label="Works with any platform">
        <div className="relative overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span
                key={i}
                className="font-display text-xs font-medium uppercase tracking-[0.32em] text-starlight/35"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-space to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-space to-transparent" />
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
              <p className="font-display text-5xl font-bold tracking-tight">
                <Counter to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix} className="grad-text" />
              </p>
              <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-starlight/55">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ------------------------------------------------------------ How it works */}
      <section className="container-x pb-24">
        <Reveal>
          <p className="eyebrow-space mb-4">Flight plan</p>
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Live in <em className="serif-accent grad-text font-normal">minutes.</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="glass h-full p-7">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-space"
                  style={{ background: "linear-gradient(120deg, #ffb454, #f06595)" }}
                >
                  {s.n}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-starlight/60">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Final CTA */}
      <section className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 400px at 50% 60%, rgba(255,180,84,0.12), transparent 60%)",
          }}
        />
        <div className="container-x relative text-center">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Your next customer is on your site{" "}
              <em className="serif-accent grad-text font-normal">right now.</em>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-starlight/60">
              Five minutes to set up. Stop losing the visitors you already paid to attract.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <WarpLink href="/pricing" className="btn-nova px-8 py-4 text-base">
                See pricing & lift off →
              </WarpLink>
              <span className="self-center text-sm text-starlight/45">or ask Nova ↘</span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function PortalCard({
  href,
  delay,
  eyebrow,
  title,
  body,
  cta,
  emblem,
}: {
  href: string;
  delay: number;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  emblem: string;
}) {
  return (
    <Reveal delay={delay}>
      <WarpLink href={href} className="group block">
        <div className="glass relative overflow-hidden p-8">
          {/* Orbit emblem */}
          <div className="relative mb-6 h-20 w-20">
            <div
              className="orbit absolute inset-0 rounded-full border border-stellar/30"
              style={{ "--orbit-duration": "18s" } as React.CSSProperties}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-stellar" />
            </div>
            <div
              className="orbit absolute inset-3 rounded-full border border-nebula/30"
              style={{ "--orbit-duration": "11s" } as React.CSSProperties}
            >
              <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-nebula" />
            </div>
            <span className="absolute inset-0 grid place-items-center text-2xl">{emblem}</span>
          </div>
          <p className="eyebrow-space mb-2">{eyebrow}</p>
          <h3 className="font-display text-2xl font-semibold">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-starlight/60">{body}</p>
          <p className="grad-text mt-5 text-sm font-bold transition group-hover:translate-x-1">
            {cta}
          </p>
        </div>
      </WarpLink>
    </Reveal>
  );
}

function Bubble({ who, children }: { who: "visitor" | "bot"; children: React.ReactNode }) {
  const isBot = who === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-snug ${
          isBot
            ? "rounded-tl-sm border border-white/[0.08] bg-white/[0.06] text-starlight/90"
            : "rounded-tr-sm bg-gradient-to-br from-nova to-nebula text-space"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
