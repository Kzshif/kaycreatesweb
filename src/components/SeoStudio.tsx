"use client";

import { useCallback, useEffect, useState } from "react";
import { ScoreRing } from "./Charts";
import type { SeoAudit, StreamEvent } from "@/lib/types";

// SEO Studio: page audits with AI recommendations + the AI content generator
// (meta tags / keywords and full blog posts).

type Tab = "audit" | "write";

export default function SeoStudio() {
  const [tab, setTab] = useState<Tab>("audit");
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">SEO Studio</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Rank higher, write faster.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Audit any page for a 0–100 score with an AI action plan, or have the AI write
          titles, meta descriptions, keywords, and full posts for your business.
        </p>
      </div>

      <div className="flex gap-2">
        <TabChip active={tab === "audit"} onClick={() => setTab("audit")}>
          ▲ Page audit
        </TabChip>
        <TabChip active={tab === "write"} onClick={() => setTab("write")}>
          ✎ AI writer
        </TabChip>
      </div>

      {tab === "audit" ? <AuditPanel /> : <WriterPanel />}
    </div>
  );
}

// --- Audit -----------------------------------------------------------------------

function AuditPanel() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [history, setHistory] = useState<SeoAudit[]>([]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/seo/audit", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setHistory(json.audits);
      setAudit((cur) => cur ?? json.audits[0] ?? null);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/seo/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setAudit(json.audit);
      loadHistory();
    } else {
      setError(json.error ?? "Audit failed — try again.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="yourwebsite.com/any-page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
        />
        <button type="submit" disabled={busy || !url.trim()} className="btn-primary disabled:opacity-60">
          {busy ? "Auditing…" : "Run audit"}
        </button>
      </form>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {audit && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <section className="card p-6">
            <div className="flex items-center gap-5">
              <ScoreRing score={audit.score} size={110} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink/85">{shortUrl(audit.url)}</p>
                <p className="text-xs text-ink/45">
                  audited {new Date(audit.createdAt).toLocaleString()}
                </p>
                {audit.mode === "live" && (
                  <span className="mt-1.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    AI recommendations · Claude
                  </span>
                )}
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {audit.checks.map((c) => (
                <li key={c.id} className="flex gap-2.5 text-sm">
                  <span
                    className={
                      c.status === "pass"
                        ? "text-mint"
                        : c.status === "warn"
                          ? "text-accent"
                          : "text-red-600"
                    }
                  >
                    {c.status === "pass" ? "●" : c.status === "warn" ? "▲" : "✕"}
                  </span>
                  <span>
                    <span className="font-semibold">{c.label}.</span>{" "}
                    <span className="text-ink/65">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-5">
            <div className="card p-6">
              <h3 className="mb-3 font-display text-lg font-semibold">✦ Your action plan</h3>
              <ol className="space-y-2.5 text-sm text-ink/80">
                {audit.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="font-display font-semibold text-accent">{i + 1}.</span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
            {(audit.suggestedTitle || audit.suggestedDescription) && (
              <div className="card p-6">
                <h3 className="mb-3 font-display text-lg font-semibold">Suggested rewrites</h3>
                {audit.suggestedTitle && <CopyBlock label="Title tag" text={audit.suggestedTitle} />}
                {audit.suggestedDescription && (
                  <CopyBlock label="Meta description" text={audit.suggestedDescription} />
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {history.length > 1 && (
        <section className="card overflow-hidden">
          <h3 className="border-b border-ink/10 px-6 py-3.5 font-display text-base font-semibold">
            Past audits
          </h3>
          <ul className="divide-y divide-ink/[0.07]">
            {history.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setAudit(a)}
                  className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left text-sm transition hover:bg-ink/[0.03]"
                >
                  <span className="truncate text-ink/75">{shortUrl(a.url)}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-ink/45">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`font-display font-semibold ${
                        a.score >= 80 ? "text-mint" : a.score >= 55 ? "text-accent" : "text-red-600"
                      }`}
                    >
                      {a.score}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// --- Writer -----------------------------------------------------------------------

interface MetaResult {
  title?: string;
  description?: string;
  keywords?: string[];
  h1?: string;
}

function WriterPanel() {
  const [kind, setKind] = useState<"meta" | "post">("meta");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<MetaResult | null>(null);
  const [post, setPost] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;
    setBusy(true);
    setError(null);
    setMeta(null);
    setPost("");

    try {
      const res = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, topic, keywords }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? "Generation failed.");
      } else if (kind === "meta") {
        setMeta((await res.json()).result);
      } else if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const evt = JSON.parse(line) as StreamEvent;
              if (evt.type === "text") setPost((p) => p + evt.text);
              if (evt.type === "error") setError(evt.message);
            } catch {}
          }
        }
      }
    } catch {
      setError("Connection failed — try again.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="card space-y-4 p-6">
        <div className="flex gap-2">
          <TabChip active={kind === "meta"} onClick={() => setKind("meta")}>
            Title, meta & keywords
          </TabChip>
          <TabChip active={kind === "post"} onClick={() => setKind("post")}>
            Full blog post
          </TabChip>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/70">
              {kind === "meta" ? "What's the page about?" : "What should the post cover?"}
            </span>
            <input
              className="input"
              placeholder={
                kind === "meta" ? "e.g. custom web design for restaurants" : "e.g. how much a small business website costs in 2026"
              }
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/70">Target keywords (optional)</span>
            <input
              className="input"
              placeholder="comma, separated, keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={busy || !topic.trim()} className="btn-primary disabled:opacity-60">
          {busy ? "Writing…" : kind === "meta" ? "✦ Generate metadata" : "✦ Write the post"}
        </button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {meta && (
        <div className="card space-y-1 p-6">
          <h3 className="mb-3 font-display text-lg font-semibold">Your metadata</h3>
          {meta.title && <CopyBlock label="Title tag" text={meta.title} />}
          {meta.description && <CopyBlock label="Meta description" text={meta.description} />}
          {meta.h1 && <CopyBlock label="H1" text={meta.h1} />}
          {meta.keywords && meta.keywords.length > 0 && (
            <div className="pt-2">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/50">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {meta.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-deep">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {post && (
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Your draft</h3>
            <CopyButton text={post} />
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
            {post}
            {busy && <span className="ml-0.5 inline-block animate-pulse">▋</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Small shared pieces ------------------------------------------------------------

function TabChip({
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
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-ink text-paper" : "border border-ink/15 text-ink/65 hover:border-ink/35"
      }`}
    >
      {children}
    </button>
  );
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
        <CopyButton text={text} />
      </div>
      <p className="rounded-lg bg-ink/[0.04] px-3 py-2 text-sm text-ink/85">{text}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs font-medium text-primary hover:underline"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
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
