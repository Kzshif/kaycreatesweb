import CosmicScene from "@/components/CosmicScene";
import HeroChat from "@/components/HeroChat";
import { Counter, Reveal } from "@/components/Motion";
import ParticleSphere from "@/components/ParticleSphere";
import Tilt from "@/components/Tilt";
import { WarpLink } from "@/components/Warp";

// Mission control — the blend: an aurora-dark hero where a particle globe
// rises under floating capability chips, then the page opens into a huge
// rounded paper sheet (light, editorial) for the content, and closes dark.

export const metadata = {
  title: { absolute: "NOVA05 — AI chatbots, receptionists, websites & SEO" },
  description:
    "NOVA05 is one studio for everything your business needs online: an AI chatbot and AI receptionist that answer visitors 24/7 and capture leads, done-for-you website creation, an AI SEO studio that gets you found, and a free QR code studio.",
  alternates: { canonical: "/" },
};

const PLATFORMS = ["WordPress", "Shopify", "Squarespace", "Wix", "Webflow", "Framer", "Custom code"];

const CHIPS = [
  { label: "✦ AI Receptionist", href: "/receptionist", pos: "left-[6%] top-[18%]", delay: "0s" },
  { label: "💬 24/7 answers", href: "/chatbot", pos: "right-[8%] top-[10%]", delay: "0.8s" },
  { label: "▲ SEO Studio", href: "/seo", pos: "left-[16%] top-[58%]", delay: "1.6s" },
  { label: "◼ Free QR codes", href: "/qr", pos: "right-[14%] top-[52%]", delay: "2.4s" },
  { label: "★ Lead capture", href: "/chatbot", pos: "left-[42%] top-[2%]", delay: "3.2s" },
];

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
      {/* ------------------------------------------- Aurora hero (dark) */}
      <section className="relative overflow-hidden pb-8">
        <div className="container-x relative pt-44 text-center lg:pt-52">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold tracking-wide text-starlight/80 backdrop-blur">
              <span className="grad-text">✦</span> Websites powered by AI — NOVA05
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mx-auto mt-8 max-w-4xl font-display text-[2.6rem] font-light leading-[1.1] tracking-tight text-starlight sm:text-6xl">
              Revolutionize your website
              <br />
              <span className="font-bold">
                with an <em className="serif-accent grad-text font-normal">AI that works.</em>
              </span>
            </h1>
          </Reveal>
          <Reveal delay={170}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-starlight/60">
              It answers your visitors, captures the leads, tunes your SEO — and if you
              don't have a website yet, we build that too.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <WarpLink
                href="/pricing"
                className="btn rounded-full bg-starlight px-7 py-3.5 text-base font-semibold text-space transition hover:bg-white"
              >
                Start free trial
              </WarpLink>
              <WarpLink href="/quiz" className="btn-space-ghost px-6 py-3.5">
                Take the 2-min scan
              </WarpLink>
            </div>
            <p className="mt-4 text-sm text-starlight/40">14 days free · no credit card</p>
          </Reveal>
        </div>

        {/* The particle globe rising over the horizon, chips in orbit */}
        <Reveal delay={200}>
          <div className="relative mx-auto mt-6 h-[300px] max-w-4xl overflow-hidden sm:h-[340px]">
            <div
              className="pointer-events-none absolute left-1/2 top-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(123,63,242,0.35), rgba(99,102,241,0.15) 55%, transparent 72%)",
                filter: "blur(24px)",
              }}
            />
            <ParticleSphere
              size={560}
              className="absolute left-1/2 top-8 -translate-x-1/2"
            />
            {CHIPS.map((c) => (
              <WarpLink
                key={c.label}
                href={c.href}
                className={`float-slow absolute ${c.pos} rounded-full border border-white/15 bg-space/60 px-3.5 py-1.5 text-xs font-semibold text-starlight/85 backdrop-blur transition hover:border-nova/60 hover:text-starlight`}
              >
                <span style={{ animationDelay: c.delay }}>{c.label}</span>
              </WarpLink>
            ))}
            {/* fade the globe into the paper sheet below */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-space to-transparent" />
          </div>
        </Reveal>
      </section>

      {/* ------------------------------ The paper sheet (light, editorial) */}
      <div className="relative z-10 mx-3 rounded-[2.5rem] bg-paper text-ink shadow-[0_-24px_80px_-40px_rgba(123,63,242,0.5)] sm:mx-6">
        {/* Watch it work */}
        <section className="container-x pb-20 pt-20">
          <Reveal>
            <p className="eyebrow mb-4 text-center">Watch it work · this is real</p>
            <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Last night, while a restaurant slept, its website{" "}
              <em className="serif-accent grad-text font-normal">closed a booking.</em>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative mx-auto mt-12 max-w-xl">
              <Tilt max={7}>
                <div className="float-slow">
                  <HeroChat light />
                </div>
              </Tilt>
            </div>
          </Reveal>
          <Reveal delay={250}>
            <p className="mt-8 text-center text-sm text-ink/50">
              The bubble in the corner of this page is the same product —{" "}
              <em className="serif-accent text-ink/75">go ask it something.</em>
            </p>
          </Reveal>
        </section>

        {/* Platform marquee */}
        <div className="border-y border-ink/[0.08] py-4" aria-label="Works with any platform">
          <div className="relative overflow-hidden">
            <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
              {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
                <span
                  key={i}
                  className="font-display text-xs font-medium uppercase tracking-[0.32em] text-ink/35"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-paper to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-paper to-transparent" />
          </div>
        </div>

        {/* Bento destinations */}
        <section className="container-x py-20">
          <Reveal>
            <p className="eyebrow mb-4">Pick a destination</p>
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
                  <div className="card flex flex-col items-center gap-4 !border-nova/30 p-7 text-center sm:flex-row sm:justify-between sm:text-left">
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
                        <p className="eyebrow mb-1">Play · 2 minutes</p>
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

        {/* Stats */}
        <section className="border-t border-ink/[0.08]">
          <div className="container-x grid gap-10 py-16 text-center sm:grid-cols-3">
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
                  <p className="mx-auto mt-2 max-w-[26ch] text-sm leading-relaxed text-ink/55">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="container-x pb-20 pt-4">
          <Reveal>
            <p className="eyebrow mb-4 text-center">Flight plan</p>
            <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Live in <em className="serif-accent grad-text font-normal">minutes.</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <Tilt max={6}>
                  <div className="card h-full p-7">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-white"
                      style={{ background: "linear-gradient(120deg, #a855f7, #22d3ee)" }}
                    >
                      {s.n}
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink/60">{s.body}</p>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* ---------------------------------------------- Finale (dark again) */}
      <section className="relative overflow-hidden py-28">
        <CosmicScene />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 400px at 50% 60%, rgba(168,85,247,0.14), transparent 60%)",
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
          <div className="card card-hover relative h-full overflow-hidden p-7">
            <div className="relative mb-5 h-14 w-14">
              <div
                className="orbit absolute inset-0 rounded-full border border-primary/25"
                style={{ "--orbit-duration": "18s" } as React.CSSProperties}
              >
                <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
              </div>
              <span className="absolute inset-0 grid place-items-center text-xl">{emblem}</span>
            </div>
            <p className="eyebrow mb-1.5">{eyebrow}</p>
            <h3 className="font-display text-xl font-semibold">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-ink/60">{children}</p>
            <p className="grad-text mt-4 text-sm font-bold transition group-hover:translate-x-1">
              Enter →
            </p>
          </div>
        </Tilt>
      </WarpLink>
    </Reveal>
  );
}
