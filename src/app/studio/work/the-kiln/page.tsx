import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Outfit } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--kiln-display",
  display: "swap",
});
const body = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--kiln-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Kiln · wood-fired kitchen, Newbury",
  description:
    "A concept site by nova05 studio: a wood-fired neighbourhood kitchen in Newbury. Seasonal plates, blistered pizzas, and a short, honest wine list.",
  robots: { index: false },
};

const MENU = [
  { name: "Ember flatbread, whipped ricotta, hot honey", price: "£7" },
  { name: "Charred leeks, romesco, toasted hazelnuts", price: "£8" },
  { name: "Margherita, fior di latte, basil oil", price: "£12" },
  { name: "Nduja & wild mushroom, smoked scamorza", price: "£15" },
  { name: "Half chicken from the oven, salsa verde", price: "£17" },
  { name: "Burnt basque cheesecake, ember cream", price: "£7" },
];

export default function KilnPage() {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-dvh`}
      style={{
        backgroundColor: "#191412",
        color: "#efe6dc",
        fontFamily: "var(--kiln-body), system-ui, sans-serif",
        colorScheme: "dark",
      }}
    >
      {/* nav */}
      <header className="border-b border-white/10">
        <nav className="mx-auto flex h-[68px] w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <p
            className="text-2xl font-semibold tracking-wide"
            style={{ fontFamily: "var(--kiln-display), serif" }}
          >
            The Kiln
          </p>
          <div className="hidden items-center gap-8 text-sm font-medium text-[#c9b8a8] sm:flex">
            <a href="#menu" className="transition-colors hover:text-[#efe6dc]">
              Menu
            </a>
            <a href="#find-us" className="transition-colors hover:text-[#efe6dc]">
              Find us
            </a>
          </div>
          <a
            href="tel:+441632960428"
            className="inline-flex items-center rounded-full bg-[#d96f32] px-5 py-2.5 text-sm font-semibold text-[#191412] transition hover:bg-[#e8814a]"
          >
            Book a table
          </a>
        </nav>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(70% 90% at 85% 110%, rgba(217,111,50,0.35), transparent 60%), radial-gradient(45% 45% at 15% 0%, rgba(217,111,50,0.12), transparent 65%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-24 pt-20 sm:px-8 sm:pt-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#d96f32]">
            Wood-fired kitchen · Newbury
          </p>
          <h1
            className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl"
            style={{ fontFamily: "var(--kiln-display), serif" }}
          >
            Everything tastes better <em className="pb-1">out of the fire.</em>
          </h1>
          <p className="mt-7 max-w-md text-lg font-light leading-relaxed text-[#c9b8a8]">
            Seasonal plates and blistered pizzas from a single oak-fired oven.
            Walk-ins welcome, dogs welcomer.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="tel:+441632960428"
              className="inline-flex items-center rounded-full bg-[#d96f32] px-7 py-3.5 font-semibold text-[#191412] transition hover:bg-[#e8814a]"
            >
              Book a table
            </a>
            <a
              href="#menu"
              className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 font-semibold text-[#efe6dc] transition hover:border-white/60"
            >
              See the menu
            </a>
          </div>
        </div>
      </section>

      {/* menu */}
      <section id="menu" className="border-t border-white/10 py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2
                className="text-4xl font-semibold sm:text-5xl"
                style={{ fontFamily: "var(--kiln-display), serif" }}
              >
                Tonight&apos;s menu
              </h2>
              <p className="mt-5 max-w-[34ch] font-light leading-relaxed text-[#c9b8a8]">
                Short and seasonal. It changes when the market does, so treat
                this as last Tuesday&apos;s evidence.
              </p>
            </div>
            <ul className="grid content-start gap-5">
              {MENU.map((item) => (
                <li
                  key={item.name}
                  className="flex items-baseline justify-between gap-6"
                >
                  <span className="text-lg">{item.name}</span>
                  <span className="shrink-0 font-semibold text-[#d96f32]">
                    {item.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* find us */}
      <section id="find-us" className="border-t border-white/10 py-20">
        <div className="mx-auto grid w-full max-w-5xl gap-12 px-5 sm:grid-cols-3 sm:px-8">
          <div>
            <h2
              className="text-3xl font-semibold"
              style={{ fontFamily: "var(--kiln-display), serif" }}
            >
              Find us
            </h2>
            <p className="mt-4 font-light leading-relaxed text-[#c9b8a8]">
              4 Bartholomew Row
              <br />
              Newbury RG14 5AA
            </p>
          </div>
          <div>
            <h2
              className="text-3xl font-semibold"
              style={{ fontFamily: "var(--kiln-display), serif" }}
            >
              Hours
            </h2>
            <p className="mt-4 font-light leading-relaxed text-[#c9b8a8]">
              Wed to Sat, 5pm till late
              <br />
              Sunday lunch, 12pm to 4pm
            </p>
          </div>
          <div>
            <h2
              className="text-3xl font-semibold"
              style={{ fontFamily: "var(--kiln-display), serif" }}
            >
              Say hello
            </h2>
            <p className="mt-4 font-light leading-relaxed text-[#c9b8a8]">
              01632 960428
              <br />
              hello@thekilnnewbury.co.uk
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <p className="mx-auto w-full max-w-5xl px-5 text-sm text-[#9c8a7a] sm:px-8">
          The Kiln is a fictional restaurant. This is a concept build by{" "}
          <Link
            href="/studio"
            className="font-semibold text-[#d96f32] underline-offset-4 hover:underline"
          >
            nova05 studio
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
