import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StructuredData } from "@/components/StructuredData";
import { VERTICAL_LIST } from "@/lib/verticals";
import { FAQS } from "@/lib/faq";

const STEPS = [
  {
    n: "01",
    title: "Divert your line",
    body: "Point your existing phone number or website chat at nova05. No new handsets, no installs, no IT project.",
  },
  {
    n: "02",
    title: "It answers — instantly",
    body: "Robin picks up in your practice's voice, knows your hours, treatments and prices, and never puts a caller on hold.",
  },
  {
    n: "03",
    title: "Work lands in your inbox",
    body: "Booked appointments, messages and callbacks flow straight to your dashboard, ready for the team.",
  },
];

const FEATURES = [
  {
    title: "Books appointments",
    body: "Captures the patient's name, number, treatment and preferred time, then files a tidy booking request to confirm.",
    icon: "📅",
    span: "lg:col-span-2",
  },
  {
    title: "Takes & triages messages",
    body: "Repeat prescriptions, billing, and urgent symptoms — flagged by priority so nothing slips.",
    icon: "📝",
    span: "",
  },
  {
    title: "Knows your practice",
    body: "Hours, treatments, plans and pricing — answered from your setup, never invented. Pre-loaded per sector.",
    icon: "🧠",
    span: "",
  },
  {
    title: "Stays in its lane",
    body: "Never gives clinical advice. Anything clinical becomes a priority message for a registered clinician.",
    icon: "🛡️",
    span: "lg:col-span-2",
  },
  {
    title: "Answers 24/7",
    body: "After-hours, lunch cover, or three callers at once — no voicemail, no missed new patients.",
    icon: "🌙",
    span: "",
  },
  {
    title: "Always logged",
    body: "Every call is recorded with a reference and handed over with full context whenever you want a human.",
    icon: "🔁",
    span: "lg:col-span-2",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "£79",
    tagline: "Single practice finding its feet",
    features: ["1 location", "Up to 300 calls / mo", "Appointments + messages", "Dashboard + email delivery"],
    highlight: false,
  },
  {
    name: "Practice",
    price: "£179",
    tagline: "Busy or growing practice",
    features: ["Up to 3 locations", "1,500 calls / mo", "Pricing & FAQ tuning", "Priority message routing", "Phone + web chat"],
    highlight: true,
  },
  {
    name: "Group",
    price: "Let's talk",
    tagline: "Multi-site group",
    features: ["Unlimited locations", "Custom volume", "PMS / system handover", "Onboarding & support", "Custom voice & branding"],
    highlight: false,
  },
];

// Stripe Payment Link URLs live in env so you can swap test → live by pasting a
// new URL into Vercel — never a code edit. Until they're set, the button falls
// back to the demo so it's never a dead link.
const CHECKOUT_URL: Record<string, string | undefined> = {
  Starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_URL,
  Practice: process.env.NEXT_PUBLIC_STRIPE_PRACTICE_URL,
};
const TRIAL_DAYS = 14;
// Where the "Contact us" (Group) button goes; set NEXT_PUBLIC_CONTACT_EMAIL to
// turn it into a mailto, otherwise it opens the demo.
const CONTACT_HREF = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}?subject=nova05%20Group%20plan`
  : "/demo";

export default function Home() {
  return (
    <>
      <StructuredData />
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* floating orbs */}
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan/20 blur-3xl floaty" />
        <div className="pointer-events-none absolute -right-16 top-40 h-72 w-72 rounded-full bg-iris/25 blur-3xl floaty" style={{ animationDelay: "2s" }} />

        <div className="container-x grid gap-12 pb-12 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div>
            <span className="chip mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_rgba(62,240,224,0.8)]" />
              AI receptionist · built in Newbury, UK
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[3.7rem]">
              Your front desk,
              <br />
              <span className="neon">never off the clock.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              nova05 answers every call for dental, GP, physio and veterinary
              practices — booking appointments, taking messages and answering the
              questions your team fields all day. So no patient ever hits voicemail.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
              In 2026 we built nova05 here in Newbury, after watching local
              practices lose new patients to missed calls. We designed Robin around
              how real front desks actually talk across dental, GP, physio and
              veterinary clinics — so it sounds like your practice, not a robot.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/demo" className="btn-primary px-7 py-3.5 text-base">
                Talk to the receptionist →
              </Link>
              <Link href="/dashboard" className="btn-ghost px-7 py-3.5 text-base">
                See the dashboard
              </Link>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                ["38%", "of practice calls go unanswered"],
                ["24/7", "cover, zero voicemail"],
                ["<1s", "to answer the phone"],
              ].map(([stat, label]) => (
                <div key={label}>
                  <dt className="font-display text-3xl font-semibold neon">{stat}</dt>
                  <dd className="mt-1 text-xs leading-snug text-slate-400">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live call card */}
          <div className="card relative overflow-hidden p-6 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan to-iris text-night">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-30" />
                  📞
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Live call · Newbury Dental Studio</p>
                  <p className="font-mono text-xs text-slate-400">Robin answered in 0.8s</p>
                </div>
              </div>
              {/* waveform */}
              <div className="flex h-7 items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="wave-bar" style={{ height: "100%", animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <Bubble who="caller">Hi, I think I&apos;ve cracked a tooth and it really hurts.</Bubble>
              <Bubble who="robin">
                Oh no, I&apos;m sorry — let&apos;s get you seen. Can I take your name and a
                good number to call you back on?
              </Bubble>
              <Bubble who="caller">Priya Nair, 07700 900173.</Bubble>
              <Bubble who="robin">
                Thank you, Priya. I&apos;m flagging this as urgent for the duty dentist
                and holding a same-day slot. They&apos;ll ring you straight back.
              </Bubble>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-cyan/20 bg-cyan/10 px-3 py-2.5 text-xs font-medium text-cyan-soft">
              <span>📝</span> Message taken · urgent · routed to duty dentist
            </div>
          </div>
        </div>

        {/* Sectors marquee */}
        <div className="relative border-y border-white/10 bg-white/[0.02] py-4">
          <div className="flex w-max marquee gap-3 px-4">
            {[...VERTICAL_LIST, ...VERTICAL_LIST].map((v, i) => (
              <span key={i} className="chip whitespace-nowrap">
                <span>{v.emoji}</span> {v.practice}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-x py-20">
        <hr className="hairline reveal mb-16" />
        <div className="reveal mb-10 max-w-2xl">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Live this afternoon. No new phone system.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="card lift reveal group relative overflow-hidden p-6 hover:border-cyan/30 hover:shadow-glow"
            >
              <span className="absolute right-5 top-4 font-mono text-6xl font-bold text-white/[0.04]">
                {s.n}
              </span>
              <span className="font-display text-2xl neon">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              {i < STEPS.length - 1 && (
                <span className="pointer-events-none absolute -right-3 top-1/2 hidden text-cyan/40 md:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section id="verticals" className="container-x py-12">
        <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Built for your sector</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Not a generic chatbot. A receptionist that speaks your field.
            </h2>
            <p className="mt-3 text-slate-400">
              Each sector ships pre-loaded with the treatments, scheduling patterns
              and questions that front desk actually handles.
            </p>
          </div>
          <Link href="/demo" className="btn-ghost">Try any of them →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICAL_LIST.map((v) => (
            <Link
              key={v.id}
              href={`/demo?vertical=${v.id}`}
              className="card lift reveal group p-6 hover:border-cyan/40 hover:shadow-glow"
            >
              <span className="text-3xl">{v.emoji}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-white">{v.label}</h3>
              <p className="mt-1 text-sm text-slate-400">{v.tagline}</p>
              <p className="mt-4 text-xs font-semibold text-cyan opacity-0 transition group-hover:opacity-100">
                Demo {v.practice} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section className="container-x py-16">
        <hr className="hairline reveal mb-16" />
        <div className="reveal mb-10 max-w-2xl">
          <p className="eyebrow mb-3">What Robin does</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything a brilliant front desk does. None of the hold music.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`card lift reveal p-6 hover:border-white/20 ${f.span}`}>
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-x py-16">
        <hr className="hairline reveal mb-16" />
        <div className="reveal mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Less than one missed new patient.
          </h2>
          <p className="mt-3 text-slate-400">
            Simple monthly pricing per practice, in pounds. No setup fees, cancel
            anytime.
          </p>
        </div>
        <div className="reveal mb-6 flex items-start gap-3 rounded-2xl border border-cyan/30 bg-cyan/5 p-4 text-sm">
          <span className="text-lg leading-none">🚀</span>
          <p className="text-slate-300">
            <span className="font-semibold text-cyan">Founding-practice offer.</span>{" "}
            The first 10 clinics lock in <span className="font-semibold text-white">£49/mo</span>{" "}
            (Starter) or <span className="font-semibold text-white">£119/mo</span> (Practice)
            for 12 months — then your normal rate. Start with a 14-day free trial.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`card lift reveal relative flex flex-col p-7 ${
                p.highlight ? "shadow-glow-iris ring-1 ring-iris/50" : "hover:border-white/20"
              }`}
            >
              {p.highlight && (
                <span className="mb-3 inline-block w-fit rounded-full bg-gradient-to-r from-cyan to-iris px-3 py-1 text-xs font-semibold text-night">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold text-white">{p.name}</h3>
              <p className="text-sm text-slate-400">{p.tagline}</p>
              <p className="mt-4 font-display text-4xl font-semibold text-white">
                {p.price}
                {p.price.startsWith("£") && (
                  <span className="text-base font-normal text-slate-500">/mo</span>
                )}
              </p>
              <ul className="mt-5 grow space-y-2.5 text-sm text-slate-300">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-cyan">✓</span> {f}
                  </li>
                ))}
              </ul>
              {p.price === "Let's talk" ? (
                <a href={CONTACT_HREF} className="btn-ghost mt-7">
                  Contact us
                </a>
              ) : CHECKOUT_URL[p.name] ? (
                <a
                  href={CHECKOUT_URL[p.name]}
                  className={`mt-7 ${p.highlight ? "btn-primary" : "btn-ghost"}`}
                >
                  Start {TRIAL_DAYS}-day free trial
                </a>
              ) : (
                // No checkout link configured yet — send them to the demo and say
                // so, rather than promising a trial that can't start.
                <a href="/demo" className={`mt-7 ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
                  Try the live demo
                </a>
              )}
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">
          {TRIAL_DAYS}-day free trial, card required — cancel anytime. Prices exclude VAT; phone-line usage (Twilio) billed separately at cost.
        </p>
      </section>

      {/* FAQ — extractable Q&A (also emitted as FAQPage JSON-LD for AI search) */}
      <section id="faq" className="container-x py-16">
        <hr className="hairline reveal mb-16" />
        <div className="reveal mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Questions, answered</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything a practice manager asks first.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.q} className="card reveal p-6">
              <h3 className="font-display text-lg font-semibold text-white">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20">
        <div className="card reveal relative overflow-hidden p-10 sm:p-14">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-iris/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Hear it answer a call right now.
            </h2>
            <p className="mt-3 text-slate-300">
              No signup. Pick a sector, describe what you&apos;d ring about, and watch
              the booking land on the dashboard in real time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/demo" className="btn-primary">Launch the demo →</Link>
              <Link href="/dashboard" className="btn-ghost">View the dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Bubble({ who, children }: { who: "caller" | "robin"; children: React.ReactNode }) {
  const isRobin = who === "robin";
  return (
    <div className={`flex ${isRobin ? "justify-start" : "justify-end"}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-snug ${
          isRobin
            ? "rounded-tl-sm border border-cyan/20 bg-cyan/10 text-slate-100"
            : "rounded-tr-sm bg-white/10 text-white"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
