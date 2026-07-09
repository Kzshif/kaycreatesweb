import AskButton from "@/components/AskButton";
import { Reveal } from "@/components/Motion";
import { WarpLink } from "@/components/Warp";

export const metadata = {
  title: "Website Creation",
  description:
    "NovaWebStudio designs and builds your business website with the AI already inside: an AI receptionist answering visitors from day one, SEO-optimized pages that rank, and branded QR codes that pull the real world onto your site.",
  alternates: { canonical: "/websites" },
};

const STEPS = [
  {
    title: "Tell us about the business",
    body: "One conversation — what you do, who you serve, what makes people choose you. That's your homework done.",
  },
  {
    title: "We design & build",
    body: "A fast, mobile-first site that looks like you hired a studio (you did). Copy written to rank for what locals actually search.",
  },
  {
    title: "The AI moves in",
    body: "Your AI receptionist is trained on your services and prices and installed before launch — the site answers customers from minute one.",
  },
  {
    title: "Launch & orbit",
    body: "We launch, submit you to Google, hand over branded QR codes for the counter, and keep the whole thing humming.",
  },
];

const INCLUDED = [
  "Custom design — no templates your competitors also bought",
  "AI receptionist trained on your business, pre-installed",
  "SEO built in: metadata, structured data, and pages written to rank",
  "Branded QR codes for menus, counters, vans, and windows",
  "Fast, mobile-first, secure hosting setup",
  "Lead inbox with AI-drafted replies from day one",
];

export default function WebsitesPage() {
  return (
    <>
      <section className="container-x pb-20 pt-44 lg:pt-52">
        <Reveal>
          <p className="eyebrow-space mb-6">The studio · done-for-you</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            We don't build websites.
            <br />
            We launch <em className="serif-accent grad-text font-normal">headquarters.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-starlight/65">
            Most websites are brochures — pretty, silent, and closed after 5pm. Ours
            ship with a trained AI receptionist, search-ready pages, and QR codes that
            pull the real world in. A website that works the room, not one that waits in it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AskButton ask="I'd like a quote for a new website for my business — what do you need to know?">
              Get a quote in chat →
            </AskButton>
            <WarpLink href="/qr" className="btn-space-ghost">
              Try the free QR Studio
            </WarpLink>
          </div>
        </Reveal>
      </section>

      {/* Brand art band — AI-illustrated, exactly what we ship for clients */}
      <section className="container-x pb-4">
        <Reveal>
          <div className="glass overflow-hidden p-2">
            <img
              src="/brand/scene.png"
              alt="Cartoon space scene: a rocket passing a ringed planet with a waving astronaut"
              loading="lazy"
              className="h-auto w-full rounded-xl object-cover"
            />
            <p className="px-4 py-3 text-center text-xs text-starlight/45">
              Illustrated by our AI studio — your site can look like this, or nothing like it.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-white/[0.07] py-20">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow-space mb-4">The flight plan</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Idea to orbit in <em className="serif-accent grad-text font-normal">four moves.</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="glass h-full p-6">
                  <span className="grad-text font-display text-2xl font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-starlight/60">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow-space mb-4">What's in the box</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything on this site?
              <br />
              <em className="serif-accent grad-text font-normal">Yours comes with it.</em>
            </h2>
            <p className="mt-5 max-w-lg text-starlight/60">
              This very site — the galaxy, the warp, the AI in the corner — is the
              product demo. Your customers get the same treatment in your brand.
            </p>
            <AskButton
              ask="What does a new website cost, roughly?"
              className="btn-nova mt-8"
            >
              Ask what it costs →
            </AskButton>
          </Reveal>
          <Reveal delay={150}>
            <div className="glass p-7">
              <ul className="space-y-3 text-sm text-starlight/70">
                {INCLUDED.map((li) => (
                  <li key={li} className="flex gap-3">
                    <span className="grad-text font-bold">✓</span> {li}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x pb-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Already have a site you love?{" "}
            <em className="serif-accent grad-text font-normal">Just add the brain.</em>
          </h2>
          <WarpLink href="/chatbot" className="btn-space-ghost mt-7">
            Meet the AI chatbot →
          </WarpLink>
        </Reveal>
      </section>
    </>
  );
}
