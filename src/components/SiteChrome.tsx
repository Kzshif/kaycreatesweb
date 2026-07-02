import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-cream font-display text-lg">
        F
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        FrontDesk<span className="text-teal">AI</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: "demo" | "dashboard" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#ai" className="hover:text-ink">AI features</Link>
          <Link href="/#verticals" className="hover:text-ink">Verticals</Link>
          <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
          <Link
            href="/demo"
            className={active === "demo" ? "text-ink" : "hover:text-ink"}
          >
            Live demo
          </Link>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-ink/70 transition hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-white/40">
      <div className="container-x flex flex-col gap-4 py-10 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p>© {new Date().getFullYear()} FrontDesk AI. A demo product, built with the Claude API.</p>
        <div className="flex gap-5">
          <Link href="/demo" className="hover:text-ink">Demo</Link>
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
