"use client";

import Link from "next/link";
import { WarpLink } from "./Warp";

/**
 * The iconic NOVA wordmark: the 5 sits directly under the O, so the O and 5
 * together read "05". N/V/A in starlight, O + 5 in the nova gradient.
 */
export function Wordmark({
  size = "text-lg",
  night = true,
  className = "",
}: {
  size?: string;
  night?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex font-display font-bold leading-none tracking-[0.14em] ${size} ${
        night ? "text-starlight" : "text-ink"
      } ${className}`}
      aria-label="NOVA 05"
    >
      N
      <span className="relative inline-block">
        <span className="grad-text">O</span>
        <span
          className="grad-text absolute left-1/2 top-[98%] -translate-x-1/2 text-[0.52em] font-bold tracking-normal"
          aria-hidden
        >
          5
        </span>
      </span>
      VA
    </span>
  );
}

/** The NOVA lockup: star mark + wordmark (extra bottom room for the tucked 5). */
export function Logo({
  className = "",
  night = false,
  href = "/",
}: {
  className?: string;
  night?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className={`group flex items-center gap-2.5 ${className}`}>
      <NovaMark />
      <span className="pb-[0.6em] leading-none">
        <Wordmark night={night} />
      </span>
    </Link>
  );
}

/** The star mark: a four-point nova burst. */
export function NovaMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden>
      <defs>
        <linearGradient id="novaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb454" />
          <stop offset="100%" stopColor="#f06595" />
        </linearGradient>
      </defs>
      <path
        d="M17 1 L20.2 13.8 L33 17 L20.2 20.2 L17 33 L13.8 20.2 L1 17 L13.8 13.8 Z"
        fill="url(#novaGrad)"
      />
      <circle cx="17" cy="17" r="2.4" fill="#1a1735" opacity="0.55" />
    </svg>
  );
}

const NAV = [
  { href: "/chatbot", label: "AI Chatbot" },
  { href: "/receptionist", label: "AI Receptionist" },
  { href: "/seo", label: "SEO" },
  { href: "/websites", label: "Websites" },
  { href: "/qr", label: "QR Studio" },
  { href: "/quiz", label: "Quiz" },
  { href: "/pricing", label: "Pricing" },
];

/** Floating pill nav for the Deep Space marketing surfaces. */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-4 z-40 px-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-white/10 bg-space/70 px-5 backdrop-blur-xl">
        <Logo night />
        <nav className="hidden items-center gap-5 text-sm font-medium text-starlight/60 lg:flex">
          {NAV.map((n) => (
            <WarpLink key={n.href} href={n.href} className="transition hover:text-starlight">
              {n.label}
            </WarpLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-starlight/70 transition hover:text-starlight sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-nova !px-4 !py-2 text-sm">
            Start free trial
          </Link>
        </div>
      </div>
      {/* Mobile / tablet page nav */}
      <nav className="mx-auto mt-2 flex max-w-6xl flex-wrap justify-center gap-2 lg:hidden">
        {NAV.map((n) => (
          <WarpLink
            key={n.href}
            href={n.href}
            className="rounded-full border border-white/10 bg-space/70 px-3 py-1.5 text-xs font-medium text-starlight/70 backdrop-blur"
          >
            {n.label}
          </WarpLink>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.07]">
      <div className="container-x flex flex-col gap-4 py-10 text-sm text-starlight/50 sm:flex-row sm:items-center sm:justify-between">
        <Logo night />
        <p>© {new Date().getFullYear()} NovaWebStudio. Built with the Claude API.</p>
        <div className="flex flex-wrap gap-4">
          {NAV.map((n) => (
            <WarpLink key={n.href} href={n.href} className="transition hover:text-starlight">
              {n.label}
            </WarpLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
