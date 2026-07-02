import Link from "next/link";
import { Logo } from "./SiteChrome";

// Split-screen chrome for the login / signup pages: brand story on the left,
// form on the right.

export function AuthPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-paper font-display text-lg font-bold">
            K
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            KayCreates<span className="text-primary-light">Web</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-semibold leading-snug">
            “The chatbot booked us three new clients the first week — while we slept.”
          </p>
          <p className="mt-4 text-sm text-paper/70">
            An AI assistant on your website that answers visitors and captures leads
            24/7, plus an SEO studio that tells you exactly how to rank better.
          </p>
        </div>
        <ul className="relative space-y-2 text-sm text-paper/75">
          <li>✓ One script tag — live on any website in minutes</li>
          <li>✓ Leads land in your inbox with AI-drafted replies</li>
          <li>✓ SEO audits, meta tags & blog posts written by AI</li>
        </ul>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
