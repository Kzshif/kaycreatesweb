"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NovaMark } from "./SiteChrome";
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-space p-4 text-starlight md:flex">
        {/* Quiet aurora at the top of the rail */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{
            background: "radial-gradient(320px 180px at 40% 0%, rgba(240,101,149,0.2), transparent 70%)",
          }}
        />
        <Link href="/app" className="relative flex items-center gap-3 px-2 py-3">
          <NovaMark size={30} />
          <span className="leading-none">
            <span className="block font-display text-base font-bold tracking-[0.22em] text-starlight">
              NOVA
            </span>
            <span className="grad-text mt-0.5 block font-display text-[9px] font-semibold tracking-[0.62em]">
              05
            </span>
          </span>
        </Link>

        <div className="relative mt-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="mt-0.5 text-xs text-starlight/45">{planBadge}</p>
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
          <p className="truncate px-2 text-xs text-starlight/40">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-xl px-2 py-2 text-left text-sm text-starlight/50 transition hover:bg-white/[0.06] hover:text-starlight"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-ink/10 bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/app" className="flex items-center gap-2 font-display text-base font-bold tracking-[0.2em]">
            <NovaMark size={24} /> NOVA<span className="grad-text">05</span>
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
