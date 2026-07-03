"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ActivityChart, ScoreRing, type DayPoint } from "./Charts";
import { Counter } from "./Motion";
import type { Briefing } from "@/lib/types";

interface Analytics {
  stats: { conversations: number; messages: number; leads: number; newLeads: number };
  series: DayPoint[];
  plan: {
    planName: string;
    onTrial: boolean;
    trialDaysLeft: number;
    used: number;
    limit: number | null;
  };
  latestAudit: { url: string; score: number; createdAt: string } | null;
}

export default function Overview({ firstName }: { firstName: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingBusy, setBriefingBusy] = useState(false);
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    const res = await fetch(`/api/analytics?days=${days}`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, [days]);

  const loadBriefing = useCallback(async (refresh = false) => {
    setBriefingBusy(true);
    const res = await fetch(`/api/insights${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
    if (res.ok) setBriefing((await res.json()).briefing);
    setBriefingBusy(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const s = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Overview</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {salutation}, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Here's what your website assistant has been up to.
          </p>
        </div>
        <Link href="/app/bots" className="btn-primary">
          💬 Manage your chatbot
        </Link>
      </div>

      {/* AI pulse briefing */}
      <section className="card relative overflow-hidden p-6">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
              ✦ Your AI pulse
              {briefing?.mode === "live" && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Claude
                </span>
              )}
            </p>
            <button
              onClick={() => loadBriefing(true)}
              disabled={briefingBusy}
              className="text-xs font-medium text-ink/50 transition hover:text-ink disabled:opacity-50"
            >
              {briefingBusy ? "Thinking…" : "↻ Regenerate"}
            </button>
          </div>
          {!briefing ? (
            <p className="text-sm text-ink/45">Reading through your recent activity…</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="font-display text-xl font-semibold leading-snug">{briefing.headline}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                  {briefing.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-ink/[0.03] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Do next
                </p>
                <ol className="space-y-2 text-sm text-ink/80">
                  {briefing.actions.map((a, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="font-display font-semibold text-accent">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Conversations" value={s?.conversations} />
        <Stat label="Messages handled" value={s?.messages} />
        <Stat label="Leads captured" value={s?.leads} accent />
        <Stat label="Leads to contact" value={s?.newLeads} warn={!!s?.newLeads} />
      </div>

      {/* Chart + side column */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="card card-hover p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Activity</h2>
            <div className="flex gap-1 text-xs">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-full px-2.5 py-1 font-medium transition ${
                    days === d ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {data ? (
            <ActivityChart data={data.series} />
          ) : (
            <div className="h-52 animate-pulse rounded-xl bg-ink/5" />
          )}
        </section>

        <div className="space-y-5">
          <section className="card card-hover p-6">
            <h2 className="mb-3 font-display text-lg font-semibold">SEO health</h2>
            {data?.latestAudit ? (
              <div className="flex items-center gap-4">
                <ScoreRing score={data.latestAudit.score} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink/80">
                    {shortUrl(data.latestAudit.url)}
                  </p>
                  <p className="text-xs text-ink/45">
                    audited {new Date(data.latestAudit.createdAt).toLocaleDateString()}
                  </p>
                  <Link href="/app/seo" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
                    Open SEO Studio →
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-ink/60">
                  No audits yet — run your first one and get an AI action plan for ranking higher.
                </p>
                <Link href="/app/seo" className="btn-primary mt-4">
                  ▲ Audit my site
                </Link>
              </div>
            )}
          </section>

          <section className="card card-hover p-6">
            <h2 className="mb-3 font-display text-lg font-semibold">Plan usage</h2>
            {data?.plan && (
              <>
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-medium text-ink/60">Chat messages this month</span>
                  <span className="font-semibold text-ink">
                    {data.plan.used}
                    {data.plan.limit ? ` / ${data.plan.limit}` : " · unlimited"}
                  </span>
                </div>
                {data.plan.limit && (
                  <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (data.plan.used / data.plan.limit) * 100)}%` }}
                    />
                  </div>
                )}
                <Link
                  href="/app/billing"
                  className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  {data.plan.onTrial
                    ? `Trial · ${data.plan.trialDaysLeft} days left — pick a plan →`
                    : "Manage plan →"}
                </Link>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function shortUrl(u: string): string {
  try {
    const p = new URL(u);
    return p.host + (p.pathname === "/" ? "" : p.pathname);
  } catch {
    return u;
  }
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="card card-hover p-4">
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p
        className={`mt-1 font-display text-3xl font-semibold ${
          warn ? "text-accent" : accent ? "text-primary" : "text-ink"
        }`}
      >
        {value === undefined ? "—" : <Counter to={value} />}
      </p>
    </div>
  );
}
