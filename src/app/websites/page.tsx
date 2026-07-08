import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Websites for local businesses",
  description:
    "We design and build fast, mobile-friendly websites for UK cafés, trades, salons, shops and B&Bs — menus, booking, galleries and online ordering included. One flat price, live in days. Every site is ready for our AI receptionist when you are.",
  alternates: { canonical: "/websites" },
  keywords: [
    "website design for small business UK",
    "restaurant website with menu",
    "tradesman website",
    "salon booking website",
    "B&B direct booking website",
  ],
};

const INCLUDED = [
  { icon: "🎨", title: "Designed for you", body: "Not a template dump — we design around your trade, your photos and your customers." },
  { icon: "✍️", title: "Words written for you", body: "You talk, we write. Menus, service lists, your story — all done for you." },
  { icon: "📱", title: "Mobile-first", body: "Most of your customers will find you on a phone. Every page is built for that first." },
  { icon: "📍", title: "Found on Google", body: "Set up to rank for '[your trade] near me' — linked to your Google Business profile." },
  { icon: "🧾", title: "Menus, booking & ordering", body: "Table booking, appointment booking, click-and-collect, quote forms — whatever your business runs on." },
  { icon: "🔧", title: "Hosting & updates sorted", body: "We host it, keep it fast and secure, and make your changes. No tech homework." },
];

export default function WebsitesPage() {
  return (
    <>
      <SiteHeader active="websites" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan/20 blur-3xl floaty" />
        <div className="pointer-events-none absolute -right-16 top-40 h-72 w-72 rounded-full bg-iris/25 blur-3xl floaty" style={{ animationDelay: "2s" }} />
        <div className="container-x pb-10 pt-16 lg:pt-24">
          <span className="chip mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_2px_rgba(62,240,224,0.8)]" />
            Website design · built in Newbury, UK
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl">
            Still running your business
            <br />
            <span className="neon">off a Facebook page?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            We build proper websites for cafés, trades, salons, shops and B&amp;Bs —
            with your menu, your prices, your booking, your photos. One flat price
            agreed before we start, live within days, and everything (design, words,
            hosting) done for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup?interest=website" className="btn-primary px-7 py-3.5 text-base">
              Sign up — get a free mockup →
            </Link>
            <a href="#examples" className="btn-ghost px-7 py-3.5 text-base">
              See example work
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            No card, no obligation — we&apos;ll mock up your homepage first, then you decide.
          </p>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="container-x py-16">
        <hr className="hairline reveal mb-16" />
        <div className="reveal mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Example work</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The kind of site we&apos;d build for you.
          </h2>
          <p className="mt-3 text-slate-400">
            Three examples in the style we build — a café with its menu online, a
            roofer with a photo portfolio and quote form, a salon that takes
            bookings while the chairs are busy.
          </p>
        </div>

        <div className="space-y-10">
          {/* Café example */}
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="reveal">
              <span className="chip mb-3">☕ Cafés · restaurants · takeaways</span>
              <h3 className="font-display text-2xl font-semibold text-white">Your menu, on Google, always current.</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                When your menu only lives on a chalkboard or a Facebook photo,
                every &quot;lunch near me&quot; search goes to the café that has one online.
                We put your full menu, hours and table booking on a fast page that
                ranks — and updating a price takes one message to us.
              </p>
            </div>
            <BrowserFrame url="theharbourkitchen.co.uk" ariaLabel="Example café website with online menu">
              <div className="bg-gradient-to-br from-amber-100 to-orange-50 p-5 text-stone-800">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-bold tracking-tight">The Harbour Kitchen</p>
                  <span className="rounded-full bg-stone-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-50">Book a table</span>
                </div>
                <div className="mt-3 grid h-20 grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-gradient-to-br from-orange-300 to-amber-400" title="Food photo" />
                  <div className="rounded-lg bg-gradient-to-br from-stone-300 to-stone-400" />
                  <div className="rounded-lg bg-gradient-to-br from-emerald-200 to-teal-300" />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">Lunch menu</p>
                <div className="mt-1.5 space-y-1.5 text-xs">
                  <MenuRow name="Crab & chilli linguine" price="£13.50" />
                  <MenuRow name="Harbour fish pie, buttered greens" price="£12.90" />
                  <MenuRow name="Smoked haddock chowder, sourdough" price="£8.50" />
                  <MenuRow name="Bakewell tart, clotted cream" price="£6.00" />
                </div>
                <div className="mt-3 flex gap-2 text-[10px] text-stone-500">
                  <span>Open today 9–4</span>·<span>01234 567890</span>·<span>Find us on the quay</span>
                </div>
              </div>
            </BrowserFrame>
          </div>

          {/* Trades example */}
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:[&>*:first-child]:order-2">
            <div className="reveal">
              <span className="chip mb-3">🔨 Trades · roofers · plumbers · landscapers</span>
              <h3 className="font-display text-2xl font-semibold text-white">Your best jobs, doing the selling.</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Homeowners shortlist trades on Google before they ring anyone. A
                photo portfolio, your reviews pulled in, and a quote form that
                lands in your pocket — so the £8,000 re-roof doesn&apos;t go to the firm
                that simply looked more established online.
              </p>
            </div>
            <BrowserFrame url="ashworthroofing.co.uk" ariaLabel="Example roofing company website with photo gallery and quote form">
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-5 text-slate-100">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-bold">Ashworth Roofing</p>
                  <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase text-white">Free quote</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Slating · tiling · flat roofs · 20 years in Leeds</p>
                <div className="mt-3 grid h-24 grid-cols-4 gap-1.5">
                  <div className="rounded-lg bg-gradient-to-br from-slate-500 to-slate-600" title="Job photo" />
                  <div className="rounded-lg bg-gradient-to-br from-red-900/70 to-orange-900/70" />
                  <div className="rounded-lg bg-gradient-to-br from-slate-400 to-slate-500" />
                  <div className="rounded-lg bg-gradient-to-br from-sky-900 to-slate-700" />
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-[11px]">
                  <span className="text-amber-400">★★★★★</span>
                  <span className="text-slate-300">&quot;Re-roofed our terrace in four days, spotless.&quot; — 47 reviews</span>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5">
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-[11px] text-slate-400">Describe the job…</div>
                  <div className="rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-bold text-white">Send</div>
                </div>
              </div>
            </BrowserFrame>
          </div>

          {/* Salon example */}
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="reveal">
              <span className="chip mb-3">💇 Salons · barbers · groomers · studios</span>
              <h3 className="font-display text-2xl font-semibold text-white">Bookings taken while your hands are busy.</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Instagram shows your work — but it can&apos;t take a 9pm booking or
                stop the marketplace apps skimming commission on your own regulars.
                Price list, gallery and self-serve booking on your own domain, with
                deposits if you want them.
              </p>
            </div>
            <BrowserFrame url="lunahairstudio.co.uk" ariaLabel="Example salon website with online booking">
              <div className="bg-gradient-to-br from-fuchsia-50 to-rose-100 p-5 text-stone-800">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-bold">Luna Hair Studio</p>
                  <span className="rounded-full bg-fuchsia-600 px-3 py-1 text-[10px] font-bold uppercase text-white">Book online</span>
                </div>
                <div className="mt-3 grid h-16 grid-cols-4 gap-1.5">
                  <div className="rounded-lg bg-gradient-to-br from-fuchsia-300 to-purple-300" title="Style photo" />
                  <div className="rounded-lg bg-gradient-to-br from-rose-300 to-pink-300" />
                  <div className="rounded-lg bg-gradient-to-br from-amber-200 to-yellow-200" />
                  <div className="rounded-lg bg-gradient-to-br from-violet-300 to-indigo-300" />
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <MenuRow name="Cut & finish" price="£38" />
                  <MenuRow name="Full head colour" price="from £75" />
                  <MenuRow name="Balayage & tone" price="from £110" />
                </div>
                <div className="mt-3 flex gap-1.5">
                  {["Tue 10:30", "Tue 2:00", "Wed 9:15", "Wed 4:45"].map((t) => (
                    <span key={t} className="rounded-lg border border-fuchsia-300 bg-white/70 px-2 py-1 text-[10px] font-semibold text-fuchsia-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="container-x py-16">
        <hr className="hairline reveal mb-16" />
        <div className="reveal mb-10 max-w-2xl">
          <p className="eyebrow mb-3">What&apos;s included</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything done for you. One flat price.
          </h2>
          <p className="mt-3 text-slate-400">
            The price is agreed before we start — no surprises, no hourly meter.
            Most sites are live within two weeks of your go-ahead.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((f) => (
            <div key={f.title} className="card lift reveal p-6 hover:border-white/20">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Receptionist upsell */}
      <section className="container-x py-16">
        <div className="card reveal relative overflow-hidden p-10 sm:p-12">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-iris/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="eyebrow mb-3">When you&apos;re ready</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Every site we build is receptionist-ready.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
                Once your website is earning, flip on Robin — our AI receptionist —
                and it answers your calls and website chat 24/7: bookings, quotes,
                messages, all landing in one dashboard. No rebuild, no new system.
                Start with the site; add the receptionist when the phone gets busy.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/demo" className="btn-primary">Hear the receptionist →</Link>
                <Link href="/signup?interest=both" className="btn-ghost">Sign up for both</Link>
              </div>
            </div>
            <div className="hidden text-center lg:block">
              <span className="text-7xl">📞</span>
              <p className="mt-3 font-mono text-xs text-slate-400">answers in &lt;1s · 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-20">
        <div className="reveal text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
            Want to see yours before you pay anything?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Sign up with your business name and we&apos;ll send a free homepage mockup
            — your name, your trade, your colours. Like it? We build the rest.
          </p>
          <Link href="/signup?interest=website" className="btn-primary mt-7 inline-block px-8 py-3.5 text-base">
            Sign up — free mockup →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function BrowserFrame({ url, children, ariaLabel }: { url: string; children: React.ReactNode; ariaLabel: string }) {
  return (
    <div className="card reveal overflow-hidden p-0" role="img" aria-label={ariaLabel}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <span className="ml-2 flex-1 rounded-md bg-white/5 px-3 py-1 font-mono text-[11px] text-slate-400">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

function MenuRow({ name, price }: { name: string; price: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-semibold">{name}</span>
      <span className="flex-1 border-b border-dotted border-stone-400" />
      <span className="font-bold">{price}</span>
    </div>
  );
}
