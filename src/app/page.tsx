import Link from "next/link";
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const STEPS = [
  {
    n: "01",
    title: "Tell it your business",
    body: "Paste in what you offer, your prices, your policies — anything a great employee would know. Takes five minutes.",
  },
  {
    n: "02",
    title: "Paste one line of code",
    body: "One script tag on any platform — WordPress, Shopify, Squarespace, Wix, custom. The chat bubble appears instantly.",
  },
  {
    n: "03",
    title: "Wake up to leads",
    body: "Your assistant answers visitors 24/7 and captures names and emails into your inbox — with AI-drafted replies ready to send.",
  },
];

const CHATBOT_FEATURES = [
  {
    icon: "🌙",
    title: "Answers 24/7",
    body: "Visitors get instant answers about your services, pricing, and policies — at 2pm or 2am, while you're with customers or asleep.",
  },
  {
    icon: "★",
    title: "Captures every lead",
    body: "When a visitor shows interest, the bot warmly collects their name and email. It lands in your inbox before they close the tab.",
  },
  {
    icon: "🎨",
    title: "Sounds like you",
    body: "Your name, your tone — friendly, professional, playful, or concise — your colors, your goal. It answers only from your business info, never inventing details.",
  },
  {
    icon: "✦",
    title: "AI-drafted follow-ups",
    body: "One click turns any captured lead into a ready-to-send reply written in your voice.",
  },
];

const SEO_FEATURES = [
  {
    icon: "▲",
    title: "Page audits with a score",
    body: "Drop in any URL and get a 0–100 score across ten checks — titles, descriptions, headings, content depth, mobile, links.",
  },
  {
    icon: "✦",
    title: "An AI action plan",
    body: "Not just red flags: a prioritized to-do list written for your page, plus rewritten titles and meta descriptions ready to paste.",
  },
  {
    icon: "✎",
    title: "Content that ranks",
    body: "Generate keywords, metadata, and full blog posts written for your business — not generic filler.",
  },
];

const PLANS = [
  {
    id: "launch",
    name: "Launch",
    price: "$29",
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
    price: "$79",
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
    price: "$199",
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
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="container-x grid gap-12 pb-12 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
        <div>
          <p className="eyebrow mb-4">AI chatbots + SEO for any website</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Your website, finally{" "}
            <span className="text-primary">working</span> for you.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            KayCreatesWeb puts an AI assistant on your site that answers visitors and
            captures leads around the clock — and an SEO studio that tells you exactly
            how to get found. Any business, any platform, one script tag.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn-primary px-7 py-3.5 text-base">
              Start your free trial →
            </Link>
            <span className="text-sm text-ink/50">
              Try the live demo — bottom-right corner of this page ↘
            </span>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              ["<5 min", "from signup to live on your site"],
              ["24/7", "answering & lead capture"],
              ["0–100", "SEO score with an AI action plan"],
            ].map(([stat, label]) => (
              <div key={label}>
                <dt className="font-display text-3xl font-semibold text-primary">{stat}</dt>
                <dd className="mt-1 text-xs leading-snug text-ink/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Hero chat mock */}
        <div className="card relative overflow-hidden p-6 sm:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-accent/20 blur-2xl" />
          <div className="mb-5 flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-primary text-paper">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" />
              💬
            </span>
            <div>
              <p className="text-sm font-semibold">Visitor on kaysdesignstudio.com · 11:42 PM</p>
              <p className="text-xs text-ink/50">Answered instantly</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <Bubble who="visitor">Do you build websites for restaurants? Rough price?</Bubble>
            <Bubble who="bot">
              We do! Restaurant sites with menus and online ordering start at $1,800 and
              take about 3 weeks. Want me to have Kay send you a detailed quote?
            </Bubble>
            <Bubble who="visitor">Yes please — mia@trattoriamia.com</Bubble>
            <Bubble who="bot">
              Perfect, Mia! I've passed your details along — you'll hear from Kay first
              thing tomorrow. 🎉
            </Bubble>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/[0.07] px-3 py-2.5 text-xs font-medium text-primary-deep">
            <span>★</span> Lead captured · mia@trattoriamia.com · AI reply drafted
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-x py-16">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Live on your site in minutes. Really.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6">
              <span className="font-display text-2xl text-accent">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chatbot pillar */}
      <section id="chatbot" className="border-y border-ink/10 bg-ink py-16 text-paper">
        <div className="container-x">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
              Pillar one · the chatbot
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              An employee who never sleeps, on every page.
            </h2>
            <p className="mt-3 text-paper/70">
              38% of visitors leave when they can't find an answer fast. Your assistant
              answers in under a second — and turns the interested ones into leads.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CHATBOT_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-paper/60">
            👉 The bubble in the corner of this page <em>is</em> the product — go ask it something.
          </p>
        </div>
      </section>

      {/* SEO pillar */}
      <section id="seo" className="container-x py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Pillar two · SEO Studio</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              A chatbot can't help visitors who never arrive.
            </h2>
            <p className="mt-3 text-ink/65">
              The SEO Studio audits your pages the way a consultant would — then writes
              the fixes and the content for you.
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {SEO_FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="text-2xl text-primary">{f.icon}</span>
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
              Pays for itself with one lead.
            </h2>
            <p className="mt-3 text-ink/65">
              Every plan starts with a 14-day free trial — no credit card required. Cancel anytime.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`card flex flex-col p-7 ${p.highlight ? "ring-2 ring-primary" : ""}`}>
                {p.highlight && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-paper">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="text-sm text-ink/55">{p.tagline}</p>
                <p className="mt-4 font-display text-4xl font-semibold">
                  {p.price}
                  <span className="text-base font-normal text-ink/50">/mo</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink/70">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`mt-7 ${p.highlight ? "btn-primary" : "btn-ghost"}`}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20">
        <div className="card relative overflow-hidden bg-ink p-10 text-paper sm:p-14">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next customer is on your site right now.
            </h2>
            <p className="mt-3 text-paper/75">
              Set up your assistant in five minutes and stop losing the visitors you
              already paid to attract.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn bg-paper text-ink hover:bg-white">
                Start your free trial →
              </Link>
              <span className="self-center text-sm text-paper/60">or chat with the demo bot ↘</span>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Dogfood: the landing page runs the actual embeddable widget. */}
      <Script src="/widget.js" data-bot="demo" strategy="lazyOnload" />
    </>
  );
}

function Bubble({ who, children }: { who: "visitor" | "bot"; children: React.ReactNode }) {
  const isBot = who === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-snug ${
          isBot ? "rounded-tl-sm bg-primary/10 text-ink" : "rounded-tr-sm bg-ink text-paper"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
