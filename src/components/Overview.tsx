"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IntentBars, VolumeChart, type DayPoint } from "./Charts";
import type { Briefing } from "@/lib/types";

interface Analytics {
  stats: {
    total: number;
    appointments: number;
    messages: number;
    callbacks: number;
    unactioned: number;
    urgent: number;
  };
  series: DayPoint[];
  intents: { intent: string; count: number }[];
  plan: {
    planName: string;
    onTrial: boolean;
    trialDaysLeft: number;
    used: number;
    limit: number | null;
  };
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
            Here's what Robin handled while you were with patients.
          </p>
        </div>
        <Link href="/app/console" className="btn-primary">
          ☏ Test your receptionist
        </Link>
      </div>

      {/* AI briefing */}
      <section className="card relative overflow-hidden p-6">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-teal-deep">
              ✦ Your AI briefing
              {briefing?.mode === "live" && (
                <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
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
            <p className="text-sm text-ink/45">Reading through today's activity…</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="font-display text-xl font-semibold leading-snug">{briefing.headline}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                  {briefing.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-teal">•</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-ink/[0.03] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Do first
                </p>
                <ol className="space-y-2 text-sm text-ink/80">
                  {briefing.actions.map((a, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="font-display font-semibold text-amber-accent">{i + 1}.</span>
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Handled all-time" value={s?.total} />
        <Stat label="Appointments" value={s?.appointments} />
        <Stat label="Messages" value={s?.messages} />
        <Stat label="Needs action" value={s?.unactioned} warn={!!s?.unactioned} />
        <Stat label="Urgent open" value={s?.urgent} critical={!!s?.urgent} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Conversations per day</h2>
            <div className="flex gap-1 text-xs">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-full px-2.5 py-1 font-medium transition ${
                    days === d ? "bg-ink text-cream" : "text-ink/55 hover:text-ink"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {data ? (
            <VolumeChart data={data.series} />
          ) : (
            <div className="h-52 animate-pulse rounded-xl bg-ink/5" />
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Why people call</h2>
          {data ? (
            <IntentBars data={data.intents} />
          ) : (
            <div className="h-52 animate-pulse rounded-xl bg-ink/5" />
          )}
          {data?.plan && (
            <div className="mt-5 border-t border-ink/10 pt-4">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-medium text-ink/60">This month's conversations</span>
                <span className="font-semibold text-ink">
                  {data.plan.used}
                  {data.plan.limit ? ` / ${data.plan.limit}` : " · unlimited"}
                </span>
              </div>
              {data.plan.limit && (
                <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${Math.min(100, (data.plan.used / data.plan.limit) * 100)}%` }}
                  />
                </div>
              )}
              <Link
                href="/app/billing"
                className="mt-2 inline-block text-xs font-semibold text-teal hover:underline"
              >
                {data.plan.onTrial ? `Trial · ${data.plan.trialDaysLeft} days left — pick a plan →` : "Manage plan →"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
  critical,
}: {
  label: string;
  value?: number;
  warn?: boolean;
  critical?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p
        className={`mt-1 font-display text-3xl font-semibold ${
          critical ? "text-red-600" : warn ? "text-amber-accent" : "text-ink"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
