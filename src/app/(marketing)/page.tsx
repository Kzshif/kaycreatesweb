import AiCore from "@/components/AiCore";
import AskNova from "@/components/AskNova";
import CosmicScene from "@/components/CosmicScene";
import HeroChat from "@/components/HeroChat";
import { Counter, Reveal } from "@/components/Motion";
import Tilt from "@/components/Tilt";
import { WarpLink } from "@/components/Warp";

// Mission control — centered, orb-first, assistant-alive. A blend of the two
// references: the glowing AI core under monumental type, then the living chat,
// then a bento of destinations.

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
      {/* ------------------------------------------------ Hero: orb + monument */}
      <section className="relative overflow-hidden">
        <AiCore className="left-1/2 top-24 -translate-x-1/2 opacity-80 sm:top-16" />
        <div className="container-x relative pt-48 text-center lg:pt-56">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-1.5 text-xs font-semibold tracking-wide text-starlight/75 backdrop-blur">
              <span className="grad-text">✦</span> NOVA05 — the AI studio for your website
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mx-auto mt-8 max-w-4xl font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
              Meet the AI that
              <br />
              <em className="serif-accent grad-text font-normal">runs your website.</em>
            </h1>
          </Reveal>
          <Reveal delay={170}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-starlight/65">
              It greets your visitors, answers their questions, captures the leads,
              tunes your SEO — and if you don't have a website yet, we build that too.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="mx-auto mt-9 max-w-xl">
              <AskNova />
            </div>
          </Reveal>
          <Reveal delay={330}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <WarpLink href="/pricing" className="btn-nova px-8 py-4 text-base">
                Start free — liftoff in 5 min →
              </WarpLink>
              <WarpLink href="/quiz" className="btn-space-ghost px-6 py-4">
                🛰️ Take the 2-min scan
              </WarpLink>
            </div>
            <p className="mt-4 text-sm text-starlight/45">14 days free · no credit card</p>
          </Reveal>
        </div>

        {/* Platform marquee, tucked under the hero */}
        <div className="mt-16 border-y border-white/[0.07] py-4" aria-label="Works with any platform">
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
        </div>
      </section>

      {/* --------------------------------------------- The living demo, centered */}
      <section className="container-x relative py-24">
        <Reveal>
          <p className="eyebrow-space mb-4 text-center">Watch it work · this is real</p>
          <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Last night, while a restaurant slept, its website{" "}
            <em className="serif-accent grad-text font-normal">closed a booking.</em>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <div className="relative mx-auto mt-12 max-w-xl">
            <Tilt max={7}>
              <div className="float-slow">
                <HeroChat />
              </div>
            </Tilt>
          </div>
        </Reveal>
        <Reveal delay={250}>
          <p className="mt-8 text-center text-sm text-starlight/50">
            The bubble in the corner of this page is the same product —{" "}
            <em className="serif-accent text-starlight/75">go ask it something.</em>
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------------- Bento destinations */}
      <section className="container-x pb-24">
        <Reveal>
          <p className="eyebrow-space mb-4">Pick a destination</p>
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One studio. <em className="serif-accent grad-text font-normal">Every orbit.</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-6">
          <Bento href="/chatbot" span="md:col-span-4" delay={0} eyebrow="Orbit one" emblem="💬" title="The AI Chatbot">
            An employee who never sleeps, on every page — answering visitors in your
            voice and turning the interested ones into leads while you're busy or asleep.
          </Bento>
          <Bento href="/receptionist" span="md:col-span-2" delay={90} eyebrow="Orbit two" emblem="✦" title="The AI Receptionist">
            The front desk for booking businesses — it captures the 9pm enquiry your
            voicemail loses.
          </Bento>
          <Bento href="/websites" span="md:col-span-2" delay={180} eyebrow="Orbit three" emblem="🪐" title="Website Creation">
            Done-for-you sites with the AI pre-installed — answering customers from
            launch day.
          </Bento>
          <Bento href="/seo" span="md:col-span-2" delay={270} eyebrow="Orbit four" emblem="▲" title="The SEO Studio">
            Audit any page 0–100, get an AI action plan, and publish content that ranks.
          </Bento>
          <Bento href="/qr" span="md:col-span-2" delay={360} eyebrow="Free tool" emblem="◼" title="The QR Studio">
            Brand-colored QR codes with a nova in the middle. Free, no signup, no watermark.
          </Bento>
          <Reveal delay={430} className="md:col-span-6">
            <WarpLink href="/quiz" className="group block">
              <Tilt max={5}>
                <div className="glass flex flex-col items-center gap-4 border-nova/25 p-7 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div className="flex items-center gap-4">
                    <img
                      src="/brand/mascot.png"
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      className="float-slow h-16 w-16 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="eyebrow-space mb-1">Play · 2 minutes</p>
                      <h3 className="font-display text-xl font-semibold">
                        The Mission Readiness Scan — what should{" "}
                        <em className="serif-accent grad-text font-normal">your</em> website be doing?
                      </h3>
                    </div>
                  </div>
                  <p className="grad-text shrink-0 text-sm font-bold transition group-hover:translate-x-1">
                    Start the scan →
                  </p>
                </div>
              </Tilt>
            </WarpLink>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- Stat band */}
      <section className="border-y border-white/[0.07]">
        <div className="container-x grid gap-10 py-20 text-center sm:grid-cols-3">
          {[
            { value: 38, suffix: "%", label: "of visitors leave when they can't find an answer fast" },
            { value: 24, suffix: "/7", label: "answering and lead capture, in your voice" },
            { value: 5, prefix: "< ", suffix: " min", label: "from signup to live on your website" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div>
                <p className="font-display text-5xl font-bold tracking-tight">
                  <Counter to={s.value} prefix={s.prefix ?? ""} suffix={s.suffix} className="grad-text" />
                </p>
                <p className="mx-auto mt-2 max-w-[26ch] text-sm leading-relaxed text-starlight/55">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ How it works */}
      <section className="container-x py-24">
        <Reveal>
          <p className="eyebrow-space mb-4 text-center">Flight plan</p>
          <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Live in <em className="serif-accent grad-text font-normal">minutes.</em>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <Tilt max={6}>
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
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Final CTA */}
      <section className="relative overflow-hidden py-28">
        <CosmicScene />
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

function Bento({
  href,
  span,
  delay,
  eyebrow,
  emblem,
  title,
  children,
}: {
  href: string;
  span: string;
  delay: number;
  eyebrow: string;
  emblem: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={delay} className={span}>
      <WarpLink href={href} className="group block h-full">
        <Tilt max={8} className="h-full">
          <div className="glass relative h-full overflow-hidden p-7">
            <div className="relative mb-5 h-14 w-14">
              <div
                className="orbit absolute inset-0 rounded-full border border-stellar/30"
                style={{ "--orbit-duration": "18s" } as React.CSSProperties}
              >
                <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-stellar" />
              </div>
              <span className="absolute inset-0 grid place-items-center text-xl">{emblem}</span>
            </div>
            <p className="eyebrow-space mb-1.5">{eyebrow}</p>
            <h3 className="font-display text-xl font-semibold">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-starlight/60">{children}</p>
            <p className="grad-text mt-4 text-sm font-bold transition group-hover:translate-x-1">
              Enter →
            </p>
          </div>
        </Tilt>
      </WarpLink>
    </Reveal>
  );
}
