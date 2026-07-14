import type { Metadata } from "next";
import Link from "next/link";
import { Archivo } from "next/font/google";
import {
  Drop,
  HardHat,
  House,
  Phone,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--kr-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kennet Ridge Roofing · repairs & re-roofs, West Berkshire",
  description:
    "A concept site by nova05 studio: a family roofing firm covering Newbury and West Berkshire. Repairs, re-roofs, flat roofs, and honest quotes.",
  robots: { index: false },
};

const SERVICES = [
  {
    icon: House,
    name: "Full re-roofs",
    body: "Tile, slate, or steel. Stripped, felted, and finished with a 20-year workmanship guarantee.",
  },
  {
    icon: Drop,
    name: "Leak repairs",
    body: "Found damp? We trace the actual fault before quoting, so you never pay for guesswork.",
  },
  {
    icon: HardHat,
    name: "Flat roofs",
    body: "EPDM rubber and GRP fibreglass for extensions, garages, and dormers.",
  },
];

export default function KennetRidgePage() {
  return (
    <div
      className={`${archivo.variable} min-h-dvh`}
      style={{
        backgroundColor: "#f4f5f7",
        color: "#1c2430",
        fontFamily: "var(--kr-font), system-ui, sans-serif",
        colorScheme: "light",
      }}
    >
      {/* nav */}
      <header className="bg-[#1c2430] text-white">
        <nav className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <p className="text-lg font-black uppercase tracking-tight">
            Kennet Ridge{" "}
            <span className="font-medium text-[#f2a516]">Roofing</span>
          </p>
          <a
            href="tel:+441632960771"
            className="inline-flex items-center gap-2 rounded-md bg-[#f2a516] px-5 py-2.5 text-sm font-bold text-[#1c2430] transition hover:bg-[#ffb52a]"
          >
            <Phone size={17} weight="bold" aria-hidden="true" />
            01632 960771
          </a>
        </nav>
      </header>

      {/* hero */}
      <section className="bg-[#1c2430] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-xl text-4xl font-black uppercase leading-[1.02] tracking-tight sm:text-6xl">
              A roof you never think about{" "}
              <span className="text-[#f2a516]">again.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#aab4c2]">
              Repairs and re-roofs across Newbury and West Berkshire. Family
              run, fully insured, and every quote is free and written.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="tel:+441632960771"
                className="inline-flex items-center rounded-md bg-[#f2a516] px-7 py-3.5 font-bold text-[#1c2430] transition hover:bg-[#ffb52a]"
              >
                Get a free quote
              </a>
              <a
                href="#services"
                className="inline-flex items-center rounded-md border border-white/30 px-7 py-3.5 font-bold text-white transition hover:border-white/70"
              >
                What we do
              </a>
            </div>
          </div>
          <ul className="grid content-center gap-4 lg:justify-items-end">
            {[
              "20-year workmanship guarantee",
              "Fully insured, £5m public liability",
              "Written quotes, no call-out fees",
            ].map((point) => (
              <li
                key={point}
                className="flex w-full max-w-sm items-center gap-3 rounded-md bg-white/5 px-5 py-4 font-semibold"
              >
                <ShieldCheck
                  size={22}
                  weight="fill"
                  className="shrink-0 text-[#f2a516]"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* services */}
      <section id="services" className="py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            What we do
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-[#dde1e7] bg-white p-7 shadow-[0_18px_40px_-30px_rgba(28,36,48,0.4)]"
              >
                <s.icon size={30} className="text-[#f2a516]" weight="duotone" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-extrabold">{s.name}</h3>
                <p className="mt-2.5 leading-relaxed text-[#55606e]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="border-y border-[#dde1e7] bg-white py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Straightforward, start to finish
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                t: "Look",
                b: "We inspect in person, photograph everything, and show you exactly what we found.",
              },
              {
                t: "Quote",
                b: "A written, itemised price within 48 hours. It doesn't change unless the job does.",
              },
              {
                t: "Fix",
                b: "Tidy crews, protected gardens, and rubbish gone the day we finish.",
              },
            ].map((step) => (
              <div key={step.t} className="border-l-4 border-[#f2a516] pl-5">
                <h3 className="text-xl font-extrabold">{step.t}</h3>
                <p className="mt-2 leading-relaxed text-[#55606e]">{step.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-6xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Water where it shouldn&apos;t be?
          </h2>
          <p className="mx-auto mt-4 max-w-[45ch] text-lg leading-relaxed text-[#55606e]">
            Call before it spreads. Emergency patch-ups usually happen within
            24 hours.
          </p>
          <a
            href="tel:+441632960771"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#1c2430] px-8 py-4 font-bold text-white transition hover:bg-[#2a3546]"
          >
            <Phone size={18} weight="bold" aria-hidden="true" />
            01632 960771
          </a>
        </div>
      </section>

      <footer className="bg-[#1c2430] py-8 text-sm text-[#aab4c2]">
        <p className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          Kennet Ridge Roofing is a fictional company. This is a concept build
          by{" "}
          <Link
            href="/studio"
            className="font-bold text-[#f2a516] underline-offset-4 hover:underline"
          >
            nova05 studio
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
