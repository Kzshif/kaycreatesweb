import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VERTICAL_LIST } from "@/lib/verticals";

const STEPS = [
  {
    n: "01",
    title: "Forward your line",
    body: "Point your existing phone number or web chat at FrontDesk AI. No new hardware, no rip-and-replace.",
  },
  {
    n: "02",
    title: "It picks up — every time",
    body: "Robin answers in your practice's voice, knows your hours, services, and FAQs, and never puts a caller on hold.",
  },
  {
    n: "03",
    title: "Work lands in your inbox",
    body: "Booked appointments, messages, and callbacks flow straight to your dashboard and scheduling system.",
  },
];

const FEATURES = [
  {
    title: "Books appointments",
    body: "Collects the name, contact, service, and preferred time, then files a structured booking request your team can confirm.",
    icon: "📅",
  },
  {
    title: "Takes messages & triages",
    body: "Captures refill requests, billing questions, and urgent symptoms — flagging anything that needs a fast callback.",
    icon: "📝",
  },
  {
    title: "Knows your practice",
    body: "Hours, services, insurance, pricing — answered from your configuration, not made up. Pre-loaded per specialty.",
    icon: "🧠",
  },
  {
    title: "Stays in its lane",
    body: "Never diagnoses or gives clinical advice. Anything clinical becomes a message for a licensed provider.",
    icon: "🛡️",
  },
  {
    title: "Answers 24/7",
    body: "After-hours, lunch rush, or three callers at once — no voicemail, no missed new patients.",
    icon: "🌙",
  },
  {
    title: "Hand-off ready",
    body: "Every interaction is logged with a reference. Escalate to a human whenever you want full context.",
    icon: "🔁",
  },
];

const PLANS = [
  {
    name: "Solo",
    price: "$149",
    tagline: "Single-provider practice",
    features: ["1 location", "Up to 400 calls / mo", "Appointments + messages", "Email + dashboard delivery"],
    highlight: false,
  },
  {
    name: "Practice",
    price: "$399",
    tagline: "Growing multi-provider clinic",
    features: ["Up to 3 locations", "2,000 calls / mo", "Insurance & FAQ tuning", "Scheduling system handoff", "Priority callback routing"],
    highlight: true,
  },
  {
    name: "Group",
    price: "Let's talk",
    tagline: "DSO / multi-site group",
    features: ["Unlimited locations", "Custom volume", "EHR / PMS integration", "SSO & audit logs", "Dedicated success manager"],
    highlight: false,
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="container-x grid gap-12 pb-10 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
        <div>
          <p className="eyebrow mb-4">The AI receptionist for clinics</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Your front desk,{" "}
            <span className="italic text-teal">answered.</span> Every call, every
            hour.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            FrontDesk AI is a vertical AI receptionist built for dental, medical,
            physiotherapy, and veterinary practices. It books appointments, takes
            messages, and answers the questions your team fields a hundred times a
            day — so no patient hits voicemail.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/demo" className="btn-primary px-7 py-3.5 text-base">
              Talk to the receptionist →
            </Link>
            <Link href="/dashboard" className="btn-ghost px-7 py-3.5 text-base">
              See the dashboard
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              ["38%", "of clinic calls go unanswered"],
              ["24/7", "coverage, no voicemail"],
              ["<1s", "to pick up the phone"],
            ].map(([stat, label]) => (
              <div key={label}>
                <dt className="font-display text-3xl font-semibold text-teal">{stat}</dt>
                <dd className="mt-1 text-xs leading-snug text-ink/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Hero call card */}
        <div className="card relative overflow-hidden p-6 sm:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-amber-accent/20 blur-2xl" />
          <div className="mb-5 flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-teal text-cream">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-30" />
              📞
            </span>
            <div>
              <p className="text-sm font-semibold">Incoming call · Brightwater Dental</p>
              <p className="text-xs text-ink/50">Robin answered in 0.8s</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <Bubble who="caller">Hi, I think I cracked a tooth and it really hurts.</Bubble>
            <Bubble who="robin">
              Oh no, I'm sorry — let's get you seen. Can I grab your name and a good
              callback number?
            </Bubble>
            <Bubble who="caller">Priya Nair, 512-555-0173.</Bubble>
            <Bubble who="robin">
              Thank you, Priya. I'm flagging this as urgent for the on-call dentist
              and holding a same-day slot. They'll call you right back.
            </Bubble>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-teal/8 px-3 py-2.5 text-xs font-medium text-teal-deep">
            <span>📝</span> Message taken · urgent · routed to on-call provider
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-x py-16">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Live in an afternoon. No new phone system.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6">
              <span className="font-display text-2xl text-amber-accent">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verticals */}
      <section id="verticals" className="border-y border-ink/10 bg-white/50 py-16">
        <div className="container-x">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3">Built for your specialty</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Not a generic chatbot. A receptionist that speaks your field.
              </h2>
              <p className="mt-3 text-ink/65">
                Each vertical ships pre-loaded with the services, scheduling
                patterns, and FAQs that practice actually handles.
              </p>
            </div>
            <Link href="/demo" className="btn-ghost">Try any of them →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VERTICAL_LIST.map((v) => (
              <Link
                key={v.id}
                href={`/demo?vertical=${v.id}`}
                className="card group p-6 transition hover:-translate-y-0.5 hover:border-teal/40"
              >
                <span className="text-3xl">{v.emoji}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{v.label}</h3>
                <p className="mt-1 text-sm text-ink/60">{v.tagline}</p>
                <p className="mt-4 text-xs font-semibold text-teal opacity-0 transition group-hover:opacity-100">
                  Demo {v.practice} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-x py-16">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">What Robin does</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything a great front desk does. None of the hold music.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-ink/10 bg-white/50 py-16">
        <div className="container-x">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow mb-3">Pricing</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Cheaper than a missed new patient.
            </h2>
            <p className="mt-3 text-ink/65">
              Flat monthly pricing per practice. Cancel anytime. Demo pricing shown.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`card flex flex-col p-7 ${
                  p.highlight ? "ring-2 ring-teal" : ""
                }`}
              >
                {p.highlight && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-teal px-3 py-1 text-xs font-semibold text-cream">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="text-sm text-ink/55">{p.tagline}</p>
                <p className="mt-4 font-display text-4xl font-semibold">
                  {p.price}
                  {p.price.startsWith("$") && (
                    <span className="text-base font-normal text-ink/50">/mo</span>
                  )}
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-ink/70">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-teal">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/demo"
                  className={`mt-7 ${p.highlight ? "btn-primary" : "btn-ghost"}`}
                >
                  {p.price === "Let's talk" ? "Contact sales" : "Start free trial"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20">
        <div className="card relative overflow-hidden bg-ink p-10 text-cream sm:p-14">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-teal/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Hear it answer a call right now.
            </h2>
            <p className="mt-3 text-cream/75">
              No signup. Pick a specialty, describe what you'd call about, and watch
              the booking land on the dashboard in real time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/demo" className="btn bg-cream text-ink hover:bg-white">
                Launch the demo →
              </Link>
              <Link
                href="/dashboard"
                className="btn border border-cream/30 text-cream hover:border-cream/70"
              >
                View the dashboard
              </Link>
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
            ? "rounded-tl-sm bg-teal/10 text-ink"
            : "rounded-tr-sm bg-ink text-cream"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
