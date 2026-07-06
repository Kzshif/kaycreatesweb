import { Reveal } from "@/components/Motion";
import { WarpLink } from "@/components/Warp";

export const metadata = {
  title: "The AI Chatbot · NOVA05",
};

const FEATURES = [
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

export default function ChatbotPage() {
  return (
    <>
      <section className="container-x pb-20 pt-44 lg:pt-52">
        <Reveal>
          <p className="eyebrow-space mb-6">Engine one · the chatbot</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            An employee who{" "}
            <em className="serif-accent grad-text font-normal">never sleeps.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-starlight/65">
            38% of visitors leave when they can't find an answer fast. Your assistant
            answers in under a second, in your voice — and turns the interested ones
            into leads with names and emails attached.
          </p>
          <p className="mt-4 text-sm text-starlight/50">
            Don't take our word for it — the bubble in the corner{" "}
            <em className="serif-accent text-starlight/80">is</em> the product. Go ask it something.
          </p>
        </Reveal>
      </section>

      <section className="container-x pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="glass h-full p-6">
                <span className="grad-text font-display text-2xl font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-starlight/60">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How your visitors experience it */}
      <section className="border-y border-white/[0.07] py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow-space mb-4">Under the hood</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              You teach it once.
              <br />
              It works <em className="serif-accent grad-text font-normal">forever.</em>
            </h2>
            <ul className="mt-7 space-y-3 text-sm text-starlight/70">
              {[
                "Paste in your services, pricing, hours, and FAQs — it answers from that and nothing else",
                "Pick a goal: capture leads, answer support questions, or sell",
                "Try it live in your dashboard before it ever meets a visitor",
                "One script tag installs it on any platform",
              ].map((li) => (
                <li key={li} className="flex gap-3">
                  <span className="grad-text font-bold">→</span> {li}
                </li>
              ))}
            </ul>
            <WarpLink href="/pricing" className="btn-nova mt-8">
              Get your chatbot →
            </WarpLink>
          </Reveal>
          <Reveal delay={150}>
            <div className="glass p-6">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-starlight/40">
                install · any website
              </p>
              <div className="rounded-xl bg-black/40 p-4">
                <code className="block break-all font-mono text-xs leading-relaxed text-stellar">
                  {'<script src="https://novawebstudio.netlify.app/widget.js" data-bot="pk_yourkey" async></script>'}
                </code>
              </div>
              <p className="mt-4 text-sm text-starlight/55">
                That's the entire installation. WordPress, Shopify, Squarespace, Wix,
                Webflow, Framer, or hand-written HTML — if it's a website, it works.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Next stop: <em className="serif-accent grad-text font-normal">getting found.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-starlight/60">
            The chatbot converts the visitors you have. The SEO Studio brings you more.
          </p>
          <WarpLink href="/seo" className="btn-space-ghost mt-7">
            Visit the SEO Studio →
          </WarpLink>
        </Reveal>
      </section>
    </>
  );
}
