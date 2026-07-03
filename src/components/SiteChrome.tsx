import Link from "next/link";

export function Logo({ className = "", night = false }: { className?: string; night?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-bold text-night"
        style={{ background: "linear-gradient(120deg, #5c7cfa, #22d3ee)" }}
      >
        K
      </span>
      <span
        className={`font-display text-xl font-semibold tracking-tight ${
          night ? "text-silver" : "text-ink"
        }`}
      >
        KayCreates<span className="grad-text">Web</span>
      </span>
    </Link>
  );
}

/** Floating pill nav for the Night marketing surfaces. */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-4 z-40 px-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-white/10 bg-night/70 px-5 backdrop-blur-xl">
        <Logo night />
        <nav className="hidden items-center gap-6 text-sm font-medium text-silver/60 md:flex">
          <Link href="/#chatbot" className="transition hover:text-silver">Chatbot</Link>
          <Link href="/#seo" className="transition hover:text-silver">SEO Studio</Link>
          <Link href="/#how" className="transition hover:text-silver">How it works</Link>
          <Link href="/#pricing" className="transition hover:text-silver">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-silver/70 transition hover:text-silver sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-volt !px-4 !py-2 text-sm">
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-night">
      <div className="container-x flex flex-col gap-4 py-10 text-sm text-silver/50 sm:flex-row sm:items-center sm:justify-between">
        <Logo night />
        <p>© {new Date().getFullYear()} KayCreatesWeb. Built with the Claude API.</p>
        <div className="flex gap-5">
          <Link href="/signup" className="transition hover:text-silver">Free trial</Link>
          <Link href="/login" className="transition hover:text-silver">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
