"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { urgencyLabel } from "@/lib/triage";
import type { CapturedEvent, CapturedKind } from "@/lib/types";

const KIND_META: Record<CapturedKind, { label: string; icon: string; tone: string }> = {
  appointment: { label: "Appointment", icon: "📅", tone: "bg-teal/10 text-teal-deep" },
  message: { label: "Message", icon: "📝", tone: "bg-amber-accent/15 text-amber-accent" },
  callback: { label: "Callback", icon: "📞", tone: "bg-ink/10 text-ink/70" },
};

type Filter = "open" | "urgent" | "all" | CapturedKind;

export default function Inbox() {
  const [events, setEvents] = useState<CapturedEvent[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  const load = useCallback(async () => {
    const res = await fetch("/api/events?scope=practice", { cache: "no-store" });
    if (res.ok) setEvents((await res.json()).events);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function action(id: string) {
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, scope: "practice" }),
    });
    load();
  }

  const visible = (events ?? [])
    .filter((e) => {
      if (filter === "all") return true;
      if (filter === "open") return e.status === "new";
      if (filter === "urgent") return e.status === "new" && e.urgency >= 4;
      return e.kind === filter;
    })
    .sort((a, b) => {
      // Open + urgent first, then newest.
      const openDelta = Number(b.status === "new") - Number(a.status === "new");
      if (openDelta) return openDelta;
      if (a.status === "new" && b.urgency !== a.urgency) return b.urgency - a.urgency;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const openCount = (events ?? []).filter((e) => e.status === "new").length;
  const urgentCount = (events ?? []).filter((e) => e.status === "new" && e.urgency >= 4).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Inbox</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything Robin captured
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Sorted by urgency. Each item comes pre-triaged — sentiment, urgency, and intent — and
            Robin can draft the reply for you.
          </p>
        </div>
        <Link href="/app/console" className="btn-ghost">
          + Generate a test call
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={filter === "open"} onClick={() => setFilter("open")}>
          Open {openCount ? `(${openCount})` : ""}
        </Chip>
        <Chip active={filter === "urgent"} onClick={() => setFilter("urgent")}>
          🔥 Urgent {urgentCount ? `(${urgentCount})` : ""}
        </Chip>
        <Chip active={filter === "appointment"} onClick={() => setFilter("appointment")}>
          📅 Appointments
        </Chip>
        <Chip active={filter === "message"} onClick={() => setFilter("message")}>
          📝 Messages
        </Chip>
        <Chip active={filter === "callback"} onClick={() => setFilter("callback")}>
          📞 Callbacks
        </Chip>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </Chip>
      </div>

      <div className="card divide-y divide-ink/[0.07] overflow-hidden">
        {events === null && <p className="p-8 text-center text-sm text-ink/50">Loading…</p>}
        {events !== null && visible.length === 0 && (
          <div className="p-10 text-center text-sm text-ink/60">
            Nothing here. Head to the{" "}
            <Link href="/app/console" className="font-medium text-teal hover:underline">
              test console
            </Link>{" "}
            and have a conversation with Robin — it'll land here instantly.
          </div>
        )}
        {visible.map((e) => (
          <Row key={e.id} event={e} onAction={() => action(e.id)} />
        ))}
      </div>
    </div>
  );
}

function Row({ event, onAction }: { event: CapturedEvent; onAction: () => void }) {
  const meta = KIND_META[event.kind];
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const detailEntries = Object.entries(event.details).filter(([, v]) => v);

  async function suggest() {
    setSuggesting(true);
    const res = await fetch("/api/events/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id }),
    });
    if (res.ok) setSuggestion((await res.json()).suggestion);
    setSuggesting(false);
  }

  async function copy() {
    if (!suggestion) return;
    await navigator.clipboard.writeText(suggestion).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`p-4 sm:p-5 ${event.status === "new" ? "" : "opacity-55"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex items-center gap-3 sm:w-44 sm:shrink-0">
          <span className={`grid h-9 w-9 place-items-center rounded-lg text-base ${meta.tone}`}>
            {meta.icon}
          </span>
          <div>
            <p className="text-sm font-semibold">{meta.label}</p>
            <p className="text-xs text-ink/45">{timeAgo(event.createdAt)}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">
              {event.name} <span className="font-normal text-ink/50">· {event.contact}</span>
            </p>
            <TriageBadges event={event} />
          </div>
          <p className="mt-0.5 text-sm text-ink/70">{event.summary}</p>
          {detailEntries.length > 0 && (
            <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/55">
              {detailEntries.map(([k, v]) => (
                <div key={k} className="flex gap-1">
                  <dt className="font-semibold capitalize">{k}:</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {suggestion && (
            <div className="mt-3 rounded-xl border border-teal/25 bg-teal/[0.06] p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-deep">
                  ✦ Suggested reply
                </p>
                <button onClick={copy} className="text-xs font-medium text-teal hover:underline">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="text-sm leading-relaxed text-ink/80">{suggestion}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          {event.status === "new" ? (
            <>
              <button
                onClick={suggest}
                disabled={suggesting}
                className="rounded-full border border-teal/40 px-3 py-1 text-xs font-semibold text-teal-deep transition hover:bg-teal/10 disabled:opacity-50"
              >
                {suggesting ? "Drafting…" : suggestion ? "↻ Redraft" : "✦ Draft reply"}
              </button>
              <button
                onClick={onAction}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink/70 transition hover:bg-ink hover:text-cream"
              >
                Mark done
              </button>
            </>
          ) : (
            <span className="text-xs font-medium text-teal">✓ Done</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TriageBadges({ event }: { event: CapturedEvent }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {event.urgency >= 4 && (
        <Badge tone={event.urgency >= 5 ? "bg-red-100 text-red-700" : "bg-amber-accent/15 text-amber-accent"}>
          {event.urgency >= 5 ? "🔥" : "⚠"} {urgencyLabel(event.urgency)}
        </Badge>
      )}
      {event.sentiment === "negative" && <Badge tone="bg-red-50 text-red-600">☹ upset</Badge>}
      {event.sentiment === "positive" && <Badge tone="bg-teal/10 text-teal-deep">☺ happy</Badge>}
      <Badge tone="bg-ink/[0.06] text-ink/60">{event.intent}</Badge>
    </span>
  );
}

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>{children}</span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-ink text-cream" : "border border-ink/15 text-ink/65 hover:border-ink/35"
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
