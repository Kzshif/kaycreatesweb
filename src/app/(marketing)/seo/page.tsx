import { Counter, Reveal } from "@/components/Motion";
import { WarpLink } from "@/components/Warp";

export const metadata = {
  title: "The SEO Studio",
  description:
    "The NOVA05 SEO Studio audits any page for a 0–100 score across ten checks, gives you a Claude-written action plan with rewritten titles and meta descriptions, and an AI writer for keywords, metadata and full blog posts.",
  alternates: { canonical: "/seo" },
};

const CHECKS = [
  ["Title tag", "pass"],
  ["Meta description", "pass"],
  ["H1 heading", "pass"],
  ["Content depth", "warn"],
  ["Mobile viewport", "pass"],
  ["Internal links", "warn"],
] as const;

export default function SeoPage() {
  return (
    <>
      <section className="container-x grid items-center gap-14 pb-20 pt-44 lg:grid-cols-2 lg:pt-52">
        <Reveal>
          <p className="eyebrow-space mb-6">Engine two · the SEO Studio</p>
          <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            Get found.
            <br />
            <em className="serif-accent grad-text font-normal">Then convert.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-starlight/65">
            Drop in any URL and the Studio audits it the way a consultant would — ten
            checks, a 0–100 score, and an AI action plan with rewritten titles and
            descriptions ready to paste.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-starlight/70">
            {[
              "0–100 score across ten on-page checks",
              "Prioritized fixes written for your page, not a generic checklist",
              "AI writer: titles, meta descriptions, keywords & full blog posts",
            ].map((li) => (
              <li key={li} className="flex gap-3">
                <span className="grad-text font-bold">→</span> {li}
              </li>
            ))}
          </ul>
          <WarpLink href="/pricing" className="btn-nova mt-8">
            Audit my site →
          </WarpLink>
        </Reveal>

        {/* Audit artifact */}
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
                      <stop offset="0%" stopColor="#ffb454" />
                      <stop offset="100%" stopColor="#f06595" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 grid place-items-center font-display text-3xl font-bold">
                  <Counter to={86} />
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">trattoriamia.com</p>
                <p className="text-xs text-starlight/45">audited just now</p>
                <span className="mt-2 inline-block rounded-full border border-nova/30 bg-nova/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-nova">
                  AI action plan · Claude
                </span>
              </div>
            </div>
            <ul className="mt-6 space-y-2.5">
              {CHECKS.map(([label, status]) => (
                <li key={label} className="flex items-center justify-between text-sm">
                  <span className="text-starlight/70">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      status === "pass" ? "bg-stellar/10 text-stellar" : "bg-nova/10 text-nova"
                    }`}
                  >
                    {status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/[0.07] pt-4 text-xs leading-relaxed text-starlight/50">
              <span className="grad-text font-bold">1.</span> Expand the menu page to 400+
              words — competitors rank with deeper pages. ·{" "}
              <span className="grad-text font-bold">2.</span> Add internal links from your
              three most-visited pages…
            </p>
          </div>
        </Reveal>
      </section>

      {/* The writer */}
      <section className="border-y border-white/[0.07] py-20">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow-space mb-4">The AI writer</p>
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Content that ranks, written{" "}
              <em className="serif-accent grad-text font-normal">for you.</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Titles & meta",
                body: "Search-ready title tags and meta descriptions, sized to the pixel and written to earn the click.",
              },
              {
                title: "Keywords",
                body: "Head terms and long-tail phrases matched to what your customers actually type.",
              },
              {
                title: "Full blog posts",
                body: "600–900 word posts in your business's voice, streamed live as the AI writes — specific and useful, zero filler.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 110}>
                <div className="glass h-full p-6">
                  <span className="grad-text font-display text-2xl font-bold">✎</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-starlight/60">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            And when they arrive? <em className="serif-accent grad-text font-normal">Nova's waiting.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-starlight/60">
            The Studio brings visitors. The chatbot turns them into customers.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <WarpLink href="/chatbot" className="btn-space-ghost">
              Meet the chatbot →
            </WarpLink>
            <WarpLink href="/pricing" className="btn-nova">
              Start free trial →
            </WarpLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
