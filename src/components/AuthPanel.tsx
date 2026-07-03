import Link from "next/link";
import FlowField from "./FlowField";
import { Logo } from "./SiteChrome";

// Split-screen chrome for the login / signup pages: the Night brand surface on
// the left (with the generative field), the Paper form on the right.

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
      <aside className="relative hidden overflow-hidden bg-night p-10 text-silver lg:flex lg:flex-col lg:justify-between">
        <FlowField seed={4242} density={90} opacity={0.55} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 500px at 30% 45%, rgba(9,11,18,0.25) 0%, rgba(9,11,18,0.85) 70%, #090b12 100%)",
          }}
        />
        <div className="relative">
          <Logo night />
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-semibold leading-snug">
            “The chatbot booked us three new clients the first week —{" "}
            <em className="serif-accent grad-text">while we slept.</em>”
          </p>
          <p className="mt-4 text-sm leading-relaxed text-silver/60">
            An AI assistant on your website that answers visitors and captures leads
            24/7, plus an SEO studio that tells you exactly how to rank better.
          </p>
        </div>
        <ul className="relative space-y-2.5 text-sm text-silver/70">
          <li className="flex gap-2.5"><span className="grad-text font-bold">✓</span> One script tag — live on any website in minutes</li>
          <li className="flex gap-2.5"><span className="grad-text font-bold">✓</span> Leads land in your inbox with AI-drafted replies</li>
          <li className="flex gap-2.5"><span className="grad-text font-bold">✓</span> SEO audits, meta tags & blog posts written by AI</li>
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
          <p className="mt-10 text-center text-xs text-ink/35">
            <Link href="/" className="transition hover:text-ink/60">← Back to kaycreatesweb.com</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
