import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan to-iris font-display text-lg font-bold text-night shadow-[0_0_22px_-4px_rgba(62,240,224,0.7)]">
        k
      </span>
      <span className="font-display text-[1.05rem] font-semibold tracking-tight text-white">
        kaycreates<span className="neon">web</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: "demo" | "dashboard" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night/70 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
          <Link href="/#how" className="hover:text-white">How it works</Link>
          <Link href="/#verticals" className="hover:text-white">Sectors</Link>
          <Link href="/#pricing" className="hover:text-white">Pricing</Link>
          <Link
            href="/dashboard"
            className={active === "dashboard" ? "text-white" : "hover:text-white"}
          >
            Dashboard
          </Link>
        </nav>
        <Link href="/demo" className="btn-primary">
          Try the live demo
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-white/[0.02]">
      <div className="container-x flex flex-col gap-4 py-10 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p>
          © {new Date().getFullYear()} kaycreatesweb · Newbury, UK. Built with the
          Claude API.
        </p>
        <div className="flex gap-5">
          <Link href="/demo" className="hover:text-white">Demo</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
