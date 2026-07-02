"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Practice, User } from "@/lib/types";

const NAV = [
  { href: "/app", label: "Overview", icon: "◎" },
  { href: "/app/inbox", label: "Inbox", icon: "☰" },
  { href: "/app/copilot", label: "Copilot", icon: "✦" },
  { href: "/app/console", label: "Test console", icon: "☏" },
  { href: "/app/settings", label: "Settings", icon: "⚙" },
  { href: "/app/billing", label: "Plan & billing", icon: "▤" },
];

export default function AppShell({
  user,
  practice,
  planBadge,
  children,
}: {
  user: User;
  practice: Practice;
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
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink p-4 text-cream md:flex">
        <Link href="/app" className="flex items-center gap-2.5 px-2 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal font-display text-lg">
            F
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            FrontDesk<span className="text-teal-light">AI</span>
          </span>
        </Link>

        <div className="mt-2 rounded-xl bg-white/5 px-3.5 py-3">
          <p className="truncate text-sm font-semibold">{practice.name}</p>
          <p className="mt-0.5 text-xs text-cream/50">{planBadge}</p>
        </div>

        <nav className="mt-4 flex-1 space-y-1">
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

        <div className="border-t border-white/10 pt-3">
          <p className="truncate px-2 text-sm">{user.name}</p>
          <p className="truncate px-2 text-xs text-cream/45">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-xl px-2 py-2 text-left text-sm text-cream/60 transition hover:bg-white/10 hover:text-cream"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-ink/10 bg-cream/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/app" className="font-display text-lg font-semibold">
            FrontDesk<span className="text-teal">AI</span>
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
                    active ? "bg-ink text-cream" : "text-ink/60"
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
