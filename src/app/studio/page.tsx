import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChatsCircle,
  PaintBrushBroad,
  Storefront,
  Wrench,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

const CONTACT_EMAIL = "novawebstudio05@gmail.com";

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--kc-ever)] pb-0.5 text-lg font-extrabold leading-none text-[var(--kc-bone)]"
      >
        n
      </span>
      <span className="text-lg font-bold tracking-tight">
        nova05<span className="font-light text-[var(--kc-moss)]"> studio</span>
      </span>
    </span>
  );
}

export default function StudioPage() {
  return (
    <main className="pb-10">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--kc-line)] bg-[var(--kc-paper)]/85 backdrop-blur-md">
        <nav
          aria-label="Main"
          className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-5 sm:px-8"
        >
          <Link href="/studio" aria-label="nova05 studio, home">
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-[var(--kc-ink-soft)] md:flex">
            <a href="#work" className="transition-colors hover:text-[var(--kc-ink)]">
              Work
            </a>
            <a href="#services" className="transition-colors hover:text-[var(--kc-ink)]">
              Services
            </a>
            <a href="#packages" className="transition-colors hover:text-[var(--kc-ink)]">
              Packages
            </a>
          </div>
          <a href="#contact" className="kc-btn kc-btn-primary !px-5 !py-2.5 text-sm">
            Start a project
          </a>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto w-full max-w-[1200px] px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="kc-canvas relative overflow-hidden rounded-[1.75rem] px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="kc-grain pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-[var(--kc-bone)] sm:text-5xl lg:text-6xl">
                Websites that win you customers.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-[#cfdcc6]">
                Custom websites for small businesses. Fixed price, live in days,
                with AI assistants built in when they help.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="#contact" className="kc-btn kc-btn-bone">
                  Start a project
                  <ArrowRight size={18} weight="bold" aria-hidden="true" />
                </a>
                <a href="#work" className="kc-btn kc-btn-ghost-dark">
                  See the work
                </a>
              </div>
            </div>

            {/* Floating proof: a real product we designed and shipped. */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="kc-glass kc-float rounded-2xl p-2.5">
                <Image
                  src="/studio/work-nova05-dashboard.webp"
                  alt="Staff dashboard of nova05, an AI receptionist product designed and built by the studio"
                  width={1800}
                  height={1125}
                  priority
                  className="rounded-xl"
                />
              </div>
              <div className="kc-glass kc-float-late absolute -bottom-9 -left-6 hidden rounded-2xl px-5 py-4 sm:block">
                <p className="text-sm font-semibold text-[var(--kc-bone)]">
                  nova05, built end to end
                </p>
                <p className="mt-0.5 text-xs text-[#cfdcc6]">
                  An AI receptionist answering for UK clinics
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* the problem we fix */}
      <section className="mx-auto w-full max-w-[1200px] px-5 py-24 sm:px-8 lg:py-32">
        <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Most small-business sites are slow, templated, and easy to ignore.
        </h2>
        <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-[var(--kc-ink-soft)]">
          Yours should load fast, look like nobody else&apos;s, and quietly do
          work for you: answering questions, taking bookings, capturing the
          customers who visit after closing time.
        </p>
        <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--kc-line)]">
          {[
            {
              title: "Days, not months",
              body: "A typical build goes from brief to live site in one to two weeks.",
            },
            {
              title: "One fixed quote",
              body: "The price we agree before starting is the price you pay. No surprises.",
            },
            {
              title: "AI where it earns its keep",
              body: "Assistants that book, answer, and take messages. Not chatbots for show.",
            },
          ].map((item, i) => (
            <div key={item.title} className={i > 0 ? "sm:pl-10" : ""}>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2.5 max-w-[36ch] leading-relaxed text-[var(--kc-ink-soft)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* selected work */}
      <section id="work" className="bg-[var(--kc-paper-2)] py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Selected work</h2>

          <div className="kc-card kc-lift mt-12 overflow-hidden">
            <Image
              src="/studio/work-nova05-home.webp"
              alt="nova05 landing page with a live call transcript from a dental practice"
              width={1800}
              height={1125}
              className="w-full border-b border-[var(--kc-line)]"
            />
            <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">
                  nova05, an AI receptionist for UK clinics
                </h3>
                <p className="mt-4 max-w-[58ch] leading-relaxed text-[var(--kc-ink-soft)]">
                  Our own product, designed and shipped end to end: marketing
                  site, a live conversational demo that streams replies token by
                  token, a staff dashboard, and a phone line answered by AI. It
                  is the level of build every project here gets.
                </p>
                <a
                  href="/"
                  className="mt-6 inline-flex items-center gap-1.5 font-semibold text-[var(--kc-moss)] transition-colors hover:text-[var(--kc-ever)]"
                >
                  Visit the live site
                  <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
                </a>
              </div>
              <dl className="grid gap-4 self-start text-sm">
                <div className="flex justify-between gap-6 border-b border-[var(--kc-line)] pb-3">
                  <dt className="text-[var(--kc-ink-soft)]">Scope</dt>
                  <dd className="font-semibold text-right">Brand, site, app, voice line</dd>
                </div>
                <div className="flex justify-between gap-6 border-b border-[var(--kc-line)] pb-3">
                  <dt className="text-[var(--kc-ink-soft)]">Stack</dt>
                  <dd className="font-semibold text-right">Next.js, Claude, Twilio</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-[var(--kc-ink-soft)]">Role</dt>
                  <dd className="font-semibold text-right">Everything</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-2xl font-bold tracking-tight">Concept builds</h3>
            <p className="max-w-[48ch] text-sm leading-relaxed text-[var(--kc-ink-soft)]">
              Live demo sites we built to show range. Click through and poke
              around, then imagine yours.
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                slug: "the-kiln",
                name: "The Kiln",
                blurb: "A wood-fired kitchen with a menu that reads like the room feels.",
              },
              {
                slug: "kennet-ridge",
                name: "Kennet Ridge Roofing",
                blurb: "A trades site built for one job: making the phone ring.",
              },
              {
                slug: "studio-nine",
                name: "Studio Nine",
                blurb: "A hair studio site as calm and warm as a good appointment.",
              },
            ].map((site) => (
              <Link
                key={site.slug}
                href={`/studio/work/${site.slug}`}
                className="kc-card kc-lift group block overflow-hidden"
              >
                <Image
                  src={`/studio/work-${site.slug}.webp`}
                  alt={`Homepage of ${site.name}, a concept site built by the studio`}
                  width={1600}
                  height={1000}
                  className="w-full border-b border-[var(--kc-line)]"
                />
                <div className="p-5">
                  <p className="flex items-center justify-between gap-2 font-bold">
                    {site.name}
                    <ArrowUpRight
                      size={17}
                      weight="bold"
                      className="shrink-0 text-[var(--kc-moss)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--kc-ink-soft)]">
                    {site.blurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* services bento */}
      <section id="services" className="mx-auto w-full max-w-[1200px] px-5 py-24 sm:px-8 lg:py-32">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What we build</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="kc-canvas kc-lift relative overflow-hidden rounded-[1.25rem] p-8 text-[var(--kc-bone)] md:col-span-2">
            <div className="kc-grain pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative">
              <PaintBrushBroad size={30} aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold tracking-tight">Business websites</h3>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-[#cfdcc6]">
                Landing pages and full sites for trades, clinics, studios, and
                shops. Designed from scratch around your business, never from a
                template, and built to load instantly.
              </p>
            </div>
          </div>
          <div className="kc-card kc-lift p-8">
            <Storefront size={30} className="text-[var(--kc-moss)]" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-bold tracking-tight">Online stores</h3>
            <p className="mt-3 leading-relaxed text-[var(--kc-ink-soft)]">
              Product pages, checkout, and payments wired up with Stripe, ready
              to sell from day one.
            </p>
          </div>
          <div className="kc-card-ever kc-lift p-8">
            <ChatsCircle size={30} aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-bold tracking-tight">AI assistants</h3>
            <p className="mt-3 leading-relaxed text-[#cfdcc6]">
              Chat and voice assistants that answer questions, take bookings,
              and capture messages around the clock. The nova05 build, for your
              business.
            </p>
          </div>
          <div className="kc-card kc-lift p-8">
            <Sparkle size={30} className="text-[var(--kc-moss)]" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-bold tracking-tight">Redesigns</h3>
            <p className="mt-3 leading-relaxed text-[var(--kc-ink-soft)]">
              Already have a site that feels dated or slow? We keep what works
              and rebuild the rest.
            </p>
          </div>
          <div className="kc-card kc-lift bg-[var(--kc-paper-2)] p-8">
            <Wrench size={30} className="text-[var(--kc-moss)]" aria-hidden="true" />
            <h3 className="mt-5 text-2xl font-bold tracking-tight">Care &amp; updates</h3>
            <p className="mt-3 leading-relaxed text-[var(--kc-ink-soft)]">
              Hosting, content changes, and small improvements handled for a
              simple monthly rate.
            </p>
          </div>
        </div>
      </section>

      {/* process */}
      <section className="border-y border-[var(--kc-line)] bg-[var(--kc-card)] py-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How a project runs
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                verb: "Brief",
                body: "A short call or message thread. We agree scope, a fixed price, and a launch date before anything starts.",
              },
              {
                verb: "Build",
                body: "You see a working preview link within days and comment on the real thing, not mockups.",
              },
              {
                verb: "Launch",
                body: "We put it live on your domain, connect analytics, and hand over everything. You own all of it.",
              },
            ].map((step, i) => (
              <li key={step.verb} className="relative">
                <span
                  className="text-sm font-bold text-[var(--kc-moss)]"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">{step.verb}</h3>
                <p className="mt-3 max-w-[40ch] leading-relaxed text-[var(--kc-ink-soft)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* packages */}
      <section id="packages" className="mx-auto w-full max-w-[1200px] px-5 py-24 sm:px-8 lg:py-32">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Fixed-price packages
        </h2>
        <p className="mt-4 max-w-[55ch] text-lg leading-relaxed text-[var(--kc-ink-soft)]">
          Every quote is agreed up front. If your project doesn&apos;t fit a
          package, we&apos;ll shape one that does.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            {
              name: "Launch page",
              price: "from £300",
              blurb: "A single sharp page that makes you look established.",
              features: [
                "Custom one-page design",
                "Copy polish included",
                "Contact form and map",
                "Live in about a week",
              ],
              dark: false,
            },
            {
              name: "Business site",
              price: "from £700",
              blurb: "The full storefront: everything a growing business needs online.",
              features: [
                "Up to six custom pages",
                "Booking or enquiry flows",
                "Search-engine foundations",
                "Live in one to two weeks",
              ],
              dark: true,
            },
            {
              name: "Site + AI assistant",
              price: "from £1,400",
              blurb: "A business site with an assistant that works while you sleep.",
              features: [
                "Everything in Business site",
                "Chat assistant trained on your business",
                "Booking and message capture",
                "Staff dashboard included",
              ],
              dark: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={
                tier.dark
                  ? "kc-canvas kc-lift relative overflow-hidden rounded-[1.25rem] p-8 text-[var(--kc-bone)]"
                  : "kc-card kc-lift p-8"
              }
            >
              {tier.dark && (
                <div className="kc-grain pointer-events-none absolute inset-0" aria-hidden="true" />
              )}
              <div className="relative">
                <h3 className="text-xl font-bold tracking-tight">{tier.name}</h3>
                <p className="mt-4 text-4xl font-bold tracking-tight">{tier.price}</p>
                <p
                  className={`mt-3 leading-relaxed ${
                    tier.dark ? "text-[#cfdcc6]" : "text-[var(--kc-ink-soft)]"
                  }`}
                >
                  {tier.blurb}
                </p>
                <ul className="mt-6 grid gap-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm font-medium">
                      <Check
                        size={17}
                        weight="bold"
                        className={`mt-0.5 shrink-0 ${
                          tier.dark ? "text-[#9fc98f]" : "text-[var(--kc-moss)]"
                        }`}
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`kc-btn mt-8 w-full ${
                    tier.dark ? "kc-btn-bone" : "kc-btn-primary"
                  }`}
                >
                  Start a project
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* contact */}
      <section id="contact" className="mx-auto w-full max-w-[1200px] px-3 sm:px-5">
        <div className="kc-canvas relative overflow-hidden rounded-[1.75rem] px-6 py-16 text-center sm:px-12 lg:py-20">
          <div className="kc-grain pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-[var(--kc-bone)] sm:text-5xl">
              Have a project in mind?
            </h2>
            <p className="mx-auto mt-5 max-w-[45ch] text-lg leading-relaxed text-[#cfdcc6]">
              Tell us what you&apos;re building and we&apos;ll reply within a
              day with a fixed quote and a launch date.
            </p>
            <div className="mt-9 flex flex-col items-center gap-4">
              <a href={`mailto:${CONTACT_EMAIL}`} className="kc-btn kc-btn-bone">
                Start a project
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm font-medium text-[#cfdcc6] underline-offset-4 transition-colors hover:text-[var(--kc-bone)] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-5 px-5 py-12 sm:flex-row sm:px-8">
        <Wordmark />
        <p className="text-sm text-[var(--kc-ink-soft)]">
          A freelance web studio. Design, build, and AI, one team.
        </p>
        <a
          href="/"
          className="text-sm font-semibold text-[var(--kc-moss)] transition-colors hover:text-[var(--kc-ever)]"
        >
          See nova05, our product
        </a>
      </footer>
    </main>
  );
}
