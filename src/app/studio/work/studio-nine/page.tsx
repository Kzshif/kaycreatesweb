import type { Metadata } from "next";
import Link from "next/link";
import { Sora } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--s9-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio Nine · hair studio, Newbury",
  description:
    "A concept site by nova05 studio: an independent hair studio in Newbury. Cuts, colour, and honest advice, booked online in seconds.",
  robots: { index: false },
};

const PRICES = [
  { name: "Cut & finish", price: "£38" },
  { name: "Restyle consultation & cut", price: "£48" },
  { name: "Full colour", price: "£72" },
  { name: "Balayage & tone", price: "£110" },
  { name: "Wedding & occasion hair", price: "from £65" },
];

export default function StudioNinePage() {
  return (
    <div
      className={`${sora.variable} min-h-dvh`}
      style={{
        backgroundColor: "#faf4f0",
        color: "#33222b",
        fontFamily: "var(--s9-font), system-ui, sans-serif",
        colorScheme: "light",
      }}
    >
      {/* nav */}
      <header className="border-b border-[#eadbd2]">
        <nav className="mx-auto flex h-[68px] w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <p className="text-xl font-extrabold tracking-tight">
            Studio<span className="text-[#a64d79]">Nine</span>
          </p>
          <div className="hidden items-center gap-8 text-sm font-medium text-[#7a6570] sm:flex">
            <a href="#prices" className="transition-colors hover:text-[#33222b]">
              Prices
            </a>
            <a href="#visit" className="transition-colors hover:text-[#33222b]">
              Visit
            </a>
          </div>
          <a
            href="tel:+441632960119"
            className="inline-flex items-center rounded-full bg-[#a64d79] px-5 py-2.5 text-sm font-semibold text-[#faf4f0] transition hover:bg-[#8f3d65]"
          >
            Book online
          </a>
        </nav>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle, rgba(166,77,121,0.18), transparent 65%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-48 -left-24 h-[420px] w-[420px] rounded-full"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle, rgba(214,151,108,0.2), transparent 65%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-24">
          <h1 className="mx-auto max-w-2xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
            Hair that still looks good on <em className="text-[#a64d79]">Thursday.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg font-light leading-relaxed text-[#7a6570]">
            Cuts and colour built around how you actually wear your hair, not
            just how it leaves the chair.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+441632960119"
              className="inline-flex items-center rounded-full bg-[#a64d79] px-7 py-3.5 font-semibold text-[#faf4f0] transition hover:bg-[#8f3d65]"
            >
              Book online
            </a>
            <a
              href="#prices"
              className="inline-flex items-center rounded-full border border-[#d9c4ba] bg-white/60 px-7 py-3.5 font-semibold text-[#33222b] transition hover:border-[#a64d79]"
            >
              See prices
            </a>
          </div>
        </div>
      </section>

      {/* three promises */}
      <section className="border-y border-[#eadbd2] bg-white/60 py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 sm:grid-cols-3 sm:px-8">
          {[
            {
              t: "Consultation first",
              b: "Fifteen unhurried minutes before any scissors. Every time, not just the first.",
            },
            {
              t: "Colour without drama",
              b: "Patch-tested, strand-tested, and honest about what one visit can do.",
            },
            {
              t: "No awkward upsell",
              b: "Product advice when you ask for it. Silence and good coffee when you don't.",
            },
          ].map((item) => (
            <div key={item.t}>
              <h2 className="text-lg font-bold">{item.t}</h2>
              <p className="mt-2 text-sm font-light leading-relaxed text-[#7a6570]">
                {item.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* prices */}
      <section id="prices" className="py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-[0_28px_60px_-38px_rgba(51,34,43,0.45)] sm:p-10">
            <h2 className="text-3xl font-extrabold tracking-tight">Prices</h2>
            <ul className="mt-7 grid gap-5">
              {PRICES.map((row) => (
                <li
                  key={row.name}
                  className="flex items-baseline justify-between gap-6"
                >
                  <span className="font-medium">{row.name}</span>
                  <span className="shrink-0 font-bold text-[#a64d79]">
                    {row.price}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-7 text-sm font-light text-[#7a6570]">
              Longer or thicker hair can take more time, so some prices flex.
              You&apos;ll always know before we start.
            </p>
          </div>
        </div>
      </section>

      {/* visit */}
      <section id="visit" className="border-t border-[#eadbd2] bg-white/60 py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 text-center sm:grid-cols-3 sm:px-8">
          <div>
            <h2 className="text-lg font-bold">Where</h2>
            <p className="mt-2 font-light text-[#7a6570]">
              9 Cheap Street, Newbury RG14 5DB
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold">When</h2>
            <p className="mt-2 font-light text-[#7a6570]">
              Tue to Sat, 9am to 6pm
              <br />
              Late nights Thursday till 8pm
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold">Book</h2>
            <p className="mt-2 font-light text-[#7a6570]">
              01632 960119
              <br />
              hello@studioninehair.co.uk
            </p>
          </div>
        </div>
      </section>

      <footer className="py-8">
        <p className="mx-auto w-full max-w-5xl px-5 text-center text-sm text-[#a08d97] sm:px-8">
          Studio Nine is a fictional salon. This is a concept build by{" "}
          <Link
            href="/studio"
            className="font-semibold text-[#a64d79] underline-offset-4 hover:underline"
          >
            nova05 studio
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
