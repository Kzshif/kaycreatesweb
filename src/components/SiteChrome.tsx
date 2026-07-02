import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-paper font-display text-lg font-bold">
        K
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        KayCreates<span className="text-primary">Web</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/80 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
          <Link href="/#chatbot" className="hover:text-ink">AI Chatbot</Link>
          <Link href="/#seo" className="hover:text-ink">SEO Studio</Link>
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
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
        <p>© {new Date().getFullYear()} KayCreatesWeb. Built with the Claude API.</p>
        <div className="flex gap-5">
          <Link href="/signup" className="hover:text-ink">Free trial</Link>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
