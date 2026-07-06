import Link from "next/link";
import { Reveal } from "@/components/Motion";

export const metadata = {
  title: "Pricing · NOVA05",
};

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
      "Remove NOVA05 branding",
      "Priority support",
    ],
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Do I need a credit card to start?",
    a: "No — every plan begins with a 14-day free trial, no card required. You only pay when you decide to stay.",
  },
  {
    q: "Will it work on my website platform?",
    a: "Yes. The chatbot installs with one script tag, which every platform supports: WordPress, Shopify, Squarespace, Wix, Webflow, Framer, and custom code.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime — upgrades and downgrades take effect immediately from your billing page.",
  },
  {
    q: "What happens if I run out of messages?",
    a: "Your visitors are never shown an error — the bot politely points them to your email until the month resets or you upgrade.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="container-x pb-16 pt-44 text-center lg:pt-52">
        <Reveal>
          <p className="eyebrow-space mb-6">Pricing</p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            Pays for itself with{" "}
            <em className="serif-accent grad-text font-normal">one lead.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-starlight/60">
            Every plan starts with a 14-day free trial — no credit card. Cancel anytime.
          </p>
        </Reveal>
      </section>

      <section className="container-x pb-24">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 120}>
              <div
                className={`glass relative h-full p-8 ${p.highlight ? "!border-nova/50" : ""}`}
                style={
                  p.highlight
                    ? {
                        boxShadow:
                          "0 0 0 1px rgba(255,180,84,0.4), 0 24px 80px -32px rgba(240,101,149,0.55)",
                      }
                    : undefined
                }
              >
                {p.highlight && (
                  <span
                    className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-space"
                    style={{ background: "linear-gradient(120deg, #ffb454, #f06595)" }}
                  >
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-starlight/50">{p.tagline}</p>
                <p className="mt-6 font-display text-5xl font-bold tracking-tight">
                  <span className="align-top text-2xl text-starlight/60">$</span>
                  {p.price}
                  <span className="font-serif text-lg italic text-starlight/45"> / month</span>
                </p>
                <ul className="mt-7 space-y-3 text-sm text-starlight/70">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="grad-text font-bold">✦</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`${p.highlight ? "btn-nova" : "btn-space-ghost"} mt-8 w-full`}
                >
                  Start free trial
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.07] py-20">
        <div className="container-x max-w-3xl">
          <Reveal>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Questions, <em className="serif-accent grad-text font-normal">answered.</em>
            </h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 80}>
                <details className="glass group p-5 open:!border-white/20">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">
                    <span className="grad-text mr-2">✦</span>
                    {f.q}
                  </summary>
                  <p className="mt-3 pl-6 text-sm leading-relaxed text-starlight/65">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-8 text-center text-sm text-starlight/50">
              Something else? Ask Nova in the corner ↘ — it knows everything on this page.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
