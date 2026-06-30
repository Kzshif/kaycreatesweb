"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { VERTICAL_LIST, getVertical } from "@/lib/verticals";
import type { CapturedEvent, VerticalId } from "@/lib/types";

interface Payload {
  events: CapturedEvent[];
  stats: {
    total: number;
    appointments: number;
    messages: number;
    callbacks: number;
    unactioned: number;
  };
}

const KIND_META: Record<CapturedEvent["kind"], { label: string; icon: string; tone: string }> = {
  appointment: { label: "Appointment", icon: "📅", tone: "bg-cyan/10 text-cyan" },
  message: { label: "Message", icon: "📝", tone: "bg-amber-accent/15 text-amber-accent" },
  callback: { label: "Callback", icon: "📞", tone: "bg-iris/15 text-iris-soft" },
};

export default function Dashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState<VerticalId | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const q = filter === "all" ? "" : `?vertical=${filter}`;
    const res = await fetch(`/api/events${q}`, { cache: "no-store" });
    const json: Payload = await res.json();
    setData(json);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // live-ish: poll for new captures
    return () => clearInterval(t);
  }, [load]);

  async function action(id: string) {
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const stats = data?.stats;
  const events = data?.events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Staff dashboard</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Captured by Robin
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Everything the receptionist handled — appointments, messages, and
            callbacks — in one queue. Updates live.
          </p>
        </div>
        <Link href="/demo" className="btn-primary">
          + Generate a new call
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total handled" value={stats?.total} />
        <Stat label="Appointments" value={stats?.appointments} accent />
        <Stat label="Messages" value={stats?.messages} />
        <Stat label="Needs action" value={stats?.unactioned} warn />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All practices
        </FilterChip>
        {VERTICAL_LIST.map((v) => (
          <FilterChip key={v.id} active={filter === v.id} onClick={() => setFilter(v.id)}>
            {v.emoji} {v.label}
          </FilterChip>
        ))}
      </div>

      {/* Queue */}
      <div className="card divide-y divide-white/8 overflow-hidden">
        {loading && <p className="p-8 text-center text-sm text-slate-400">Loading…</p>}
        {!loading && events.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-400">
              Nothing here yet. Head to the{" "}
              <Link href="/demo" className="font-medium text-cyan underline-offset-2 hover:underline">
                demo
              </Link>{" "}
              and book something — it'll show up instantly.
            </p>
          </div>
        )}
        {events.map((e) => (
          <Row key={e.id} event={e} onAction={() => action(e.id)} />
        ))}
      </div>
    </div>
  );
}

function Row({ event, onAction }: { event: CapturedEvent; onAction: () => void }) {
  const meta = KIND_META[event.kind];
  const v = getVertical(event.vertical);
  const detailEntries = Object.entries(event.details).filter(([, val]) => val);
  return (
    <div className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-5 ${event.status === "new" ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3 sm:w-48 sm:shrink-0">
        <span className={`grid h-9 w-9 place-items-center rounded-lg text-base ${meta.tone}`}>
          {meta.icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{meta.label}</p>
          <p className="text-xs text-slate-500">
            {v.emoji} {v.practice}
          </p>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-white">
          {event.name} <span className="font-normal text-slate-400">· {event.contact}</span>
        </p>
        <p className="mt-0.5 text-sm text-slate-300">{event.summary}</p>
        {detailEntries.length > 0 && (
          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
            {detailEntries.map(([k, val]) => (
              <div key={k} className="flex gap-1">
                <dt className="font-semibold capitalize">{k}:</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <span className="text-xs text-slate-500">{timeAgo(event.createdAt)}</span>
        {event.status === "new" ? (
          <button
            onClick={onAction}
            className="rounded-full border border-cyan/40 px-3 py-1 text-xs font-semibold text-cyan transition hover:bg-cyan hover:text-night"
          >
            Mark actioned
          </button>
        ) : (
          <span className="text-xs font-medium text-cyan">✓ Actioned</span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value?: number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p
        className={`mt-1 font-display text-3xl font-semibold ${
          warn && value ? "text-amber-accent" : accent ? "text-cyan" : "text-white"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-cyan to-iris text-night"
          : "border border-white/15 text-slate-300 hover:border-white/35"
      }`}
    >
      {children}
    </button>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
