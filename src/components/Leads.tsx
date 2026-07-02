"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Conversation, Lead } from "@/lib/types";

// Leads inbox + recent conversations. Every lead gets a one-click AI-drafted
// follow-up email.

type Tab = "leads" | "conversations";

export default function Leads() {
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [filter, setFilter] = useState<"new" | "all">("new");

  const load = useCallback(async () => {
    const [l, c] = await Promise.all([
      fetch("/api/leads", { cache: "no-store" }),
      fetch("/api/conversations", { cache: "no-store" }),
    ]);
    if (l.ok) setLeads((await l.json()).leads);
    if (c.ok) setConvos((await c.json()).conversations);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  async function markContacted(id: string) {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const visibleLeads = (leads ?? []).filter((l) => (filter === "new" ? l.status === "new" : true));
  const newCount = (leads ?? []).filter((l) => l.status === "new").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Leads</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            People your bot brought in
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Every visitor who left their details, captured while you were doing something else.
            One click drafts the follow-up.
          </p>
        </div>
        <Link href="/app/bots" className="btn-ghost">
          💬 Try your bot
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={tab === "leads"} onClick={() => setTab("leads")}>
          ★ Leads {newCount ? `(${newCount} new)` : ""}
        </Chip>
        <Chip active={tab === "conversations"} onClick={() => setTab("conversations")}>
          💬 Conversations
        </Chip>
        {tab === "leads" && (
          <div className="ml-auto flex gap-2 text-xs">
            <Chip active={filter === "new"} onClick={() => setFilter("new")}>
              To contact
            </Chip>
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </Chip>
          </div>
        )}
      </div>

      {tab === "leads" ? (
        <div className="card divide-y divide-ink/[0.07] overflow-hidden">
          {leads === null && <p className="p-8 text-center text-sm text-ink/50">Loading…</p>}
          {leads !== null && visibleLeads.length === 0 && (
            <div className="p-10 text-center text-sm text-ink/60">
              No leads {filter === "new" ? "waiting" : "yet"}. Chat with your bot in the{" "}
              <Link href="/app/bots" className="font-medium text-primary hover:underline">
                live preview
              </Link>{" "}
              and leave an email — it'll land here instantly.
            </div>
          )}
          {visibleLeads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onContacted={() => markContacted(lead.id)} />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-ink/[0.07] overflow-hidden">
          {convos === null && <p className="p-8 text-center text-sm text-ink/50">Loading…</p>}
          {convos !== null && convos.length === 0 && (
            <p className="p-10 text-center text-sm text-ink/60">No conversations yet.</p>
          )}
          {(convos ?? []).map((c) => (
            <ConvoRow key={c.id} convo={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead, onContacted }: { lead: Lead; onContacted: () => void }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const isNew = lead.status === "new";

  async function suggest() {
    setSuggesting(true);
    const res = await fetch("/api/leads/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id }),
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
    <div className={`p-4 sm:p-5 ${isNew ? "" : "opacity-55"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-base">★</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{lead.name}</p>
            <p className="text-xs text-ink/45">{timeAgo(lead.createdAt)}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">{lead.email}</p>
          <p className="mt-0.5 text-sm text-ink/70">
            {lead.message || "Left their contact details via the chatbot."}
          </p>
          <p className="mt-1 text-xs text-ink/45">via {lead.source}</p>

          {suggestion && (
            <div className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.05] p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-deep">
                  ✦ Suggested reply
                </p>
                <button onClick={copy} className="text-xs font-medium text-primary hover:underline">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{suggestion}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          {isNew ? (
            <>
              <button
                onClick={suggest}
                disabled={suggesting}
                className="rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary-deep transition hover:bg-primary/10 disabled:opacity-50"
              >
                {suggesting ? "Drafting…" : suggestion ? "↻ Redraft" : "✦ Draft reply"}
              </button>
              <button
                onClick={onContacted}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink/70 transition hover:bg-ink hover:text-paper"
              >
                Mark contacted
              </button>
            </>
          ) : (
            <span className="text-xs font-medium text-mint">✓ Contacted</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvoRow({ convo }: { convo: Conversation }) {
  const [open, setOpen] = useState(false);
  const lastUser = [...convo.transcript].reverse().find((m) => m.role === "user");
  return (
    <div className="p-4 sm:p-5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-base">💬</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink/80">
            {lastUser?.content ?? "(no messages)"}
          </p>
          <p className="mt-0.5 text-xs text-ink/45">
            {convo.messageCount} message{convo.messageCount === 1 ? "" : "s"} ·{" "}
            {timeAgo(convo.lastMessageAt)}
            {convo.visitorId.startsWith("sample_") && " · sample data"}
            {convo.visitorId === "preview" && " · your preview"}
          </p>
        </div>
        <span className="text-ink/40">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 rounded-xl bg-ink/[0.03] p-3">
          {convo.transcript.map((m, i) => (
            <p key={i} className="text-sm leading-relaxed">
              <span className={`font-semibold ${m.role === "user" ? "text-accent" : "text-primary"}`}>
                {m.role === "user" ? "Visitor" : "Bot"}:
              </span>{" "}
              <span className="text-ink/75">{m.content}</span>
            </p>
          ))}
        </div>
      )}
    </div>
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
        active ? "bg-ink text-paper" : "border border-ink/15 text-ink/65 hover:border-ink/35"
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
