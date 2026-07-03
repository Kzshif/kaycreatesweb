"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User, Workspace } from "@/lib/types";

const NAV = [
  { href: "/app", label: "Overview", icon: "◎" },
  { href: "/app/bots", label: "Chatbots", icon: "💬" },
  { href: "/app/leads", label: "Leads", icon: "★" },
  { href: "/app/seo", label: "SEO Studio", icon: "▲" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
  { href: "/app/billing", label: "Plan & billing", icon: "▤" },
];

export default function AppShell({
  user,
  workspace,
  planBadge,
  children,
}: {
  user: User;
  workspace: Workspace;
  planBadge: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — the Night surface inside the app */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-night p-4 text-silver md:flex">
        {/* Quiet aurora at the top of the rail */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{
            background: "radial-gradient(320px 180px at 40% 0%, rgba(76,110,245,0.22), transparent 70%)",
          }}
        />
        <Link href="/app" className="relative flex items-center gap-2.5 px-2 py-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-bold text-night"
            style={{ background: "linear-gradient(120deg, #5c7cfa, #22d3ee)" }}
          >
            K
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            KayCreates<span className="grad-text">Web</span>
          </span>
        </Link>

        <div className="relative mt-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="mt-0.5 text-xs text-silver/45">{planBadge}</p>
        </div>

        <nav className="relative mt-4 flex-1 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`side-link ${active ? "side-link-active" : ""}`}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 pt-3">
          <p className="truncate px-2 text-sm">{user.name}</p>
          <p className="truncate px-2 text-xs text-silver/40">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-xl px-2 py-2 text-left text-sm text-silver/50 transition hover:bg-white/[0.06] hover:text-silver"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-ink/10 bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/app" className="font-display text-lg font-semibold">
            KayCreates<span className="grad-text">Web</span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto text-xs font-medium">
            {NAV.map((item) => {
              const active =
                item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1.5 ${
                    active ? "bg-ink text-paper" : "text-ink/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
