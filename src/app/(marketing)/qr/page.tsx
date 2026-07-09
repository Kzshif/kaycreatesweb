import QrStudio from "@/components/QrStudio";
import { Reveal } from "@/components/Motion";
import { WarpLink } from "@/components/Warp";

export const metadata = {
  title: "Free QR Code Studio",
  description:
    "Make beautiful brand-colored QR codes free in your browser — no signup, no watermark. Point them at your website, menu, review page or WiFi, and pair them with a NOVA05 AI chatbot so every scan lands somewhere that answers.",
  alternates: { canonical: "/qr" },
};

const USES = [
  { title: "Table menus", body: "Scan → menu → the AI answers “is the pad thai gluten free?” before the waiter arrives." },
  { title: "Review cards", body: "A code by the till that takes happy customers straight to your Google review page." },
  { title: "Vans & windows", body: "Your van is parked in front of 10,000 people a day. Give them somewhere to land." },
  { title: "Flyers & posters", body: "Every print run becomes measurable — and the landing page answers questions itself." },
];

export default function QrPage() {
  return (
    <>
      <section className="container-x pb-14 pt-44 lg:pt-52">
        <Reveal>
          <p className="eyebrow-space mb-6">Free tool · the QR studio</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
            The bridge between{" "}
            <em className="serif-accent grad-text font-normal">street and site.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-starlight/65">
            Brand-colored QR codes, generated right here in your browser. Free, no
            signup, no watermark — with an optional nova star in the middle. Point one
            at your website and let your AI receptionist take it from there.
          </p>
        </Reveal>
      </section>

      <section className="container-x pb-20">
        <Reveal>
          <QrStudio />
        </Reveal>
      </section>

      <section className="border-y border-white/[0.07] py-20">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow-space mb-4">Low effort · high demand</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Where the codes <em className="serif-accent grad-text font-normal">earn their keep.</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {USES.map((u, i) => (
              <Reveal key={u.title} delay={i * 100}>
                <div className="glass h-full p-6">
                  <span className="grad-text font-display text-2xl font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{u.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-starlight/60">{u.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A scan is a visitor.{" "}
            <em className="serif-accent grad-text font-normal">Make it a customer.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-starlight/60">
            The code gets them to your site. The NOVA05 receptionist answers their
            questions and takes their details. That's the whole funnel — on a sticker.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <WarpLink href="/receptionist" className="btn-nova">
              Meet the receptionist →
            </WarpLink>
            <WarpLink href="/pricing" className="btn-space-ghost">
              See pricing
            </WarpLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
