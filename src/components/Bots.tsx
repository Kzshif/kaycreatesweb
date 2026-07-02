"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StreamChat from "./StreamChat";
import type { Bot } from "@/lib/types";

// Chatbot management: configure, preview live, and grab the embed snippet.

const TONES = ["friendly", "professional", "playful", "concise"];
const GOALS: { id: Bot["goal"]; label: string; hint: string }[] = [
  { id: "leads", label: "Capture leads", hint: "Helpful first, then asks for contact details" },
  { id: "support", label: "Answer questions", hint: "Support-first, offers handoff when stuck" },
  { id: "sales", label: "Sell", hint: "Connects needs to your offering, drives next steps" },
];

export default function Bots() {
  const [bots, setBots] = useState<Bot[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Bot | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bump to remount the preview after saving so it picks up new config.
  const [previewEpoch, setPreviewEpoch] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/bots", { cache: "no-store" });
    if (!res.ok) return;
    const json: { bots: Bot[] } = await res.json();
    setBots(json.bots);
    setSelectedId((cur) => cur ?? json.bots[0]?.id ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const bot = bots?.find((b) => b.id === selectedId) ?? null;
    setDraft(bot ? { ...bot, faq: bot.faq.map((f) => ({ ...f })) } : null);
  }, [bots, selectedId]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/bots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      await load();
      setSaved(true);
      setPreviewEpoch((e) => e + 1);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Save failed");
    }
    setSaving(false);
  }

  async function addBot() {
    setError(null);
    const res = await fetch("/api/bots", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (res.ok) {
      const { bot } = await res.json();
      await load();
      setSelectedId(bot.id);
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Couldn't create bot");
    }
  }

  function patch<K extends keyof Bot>(key: K, value: Bot[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  const embedSnippet = useMemo(() => {
    if (!draft) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://your-app.example.com";
    return `<script src="${origin}/widget.js" data-bot="${draft.publicKey}" async></script>`;
  }, [draft]);

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedSnippet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (bots === null) return <div className="h-96 animate-pulse rounded-2xl bg-ink/5" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Chatbots</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your website assistant
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Teach it your business, try it live, then paste one line of code into your site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bots.length > 1 && (
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input w-auto"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={addBot} className="btn-ghost">
            + New bot
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {draft && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          {/* Editor */}
          <div className="space-y-5">
            <section className="card space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Personality</h2>
                <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save & update preview"}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bot name">
                  <input className="input" value={draft.name} onChange={(e) => patch("name", e.target.value)} />
                </Field>
                <Field label="Widget color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.color}
                      onChange={(e) => patch("color", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-ink/15 bg-white p-1"
                    />
                    <input className="input flex-1" value={draft.color} onChange={(e) => patch("color", e.target.value)} />
                  </div>
                </Field>
              </div>
              <Field label="Tone">
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => patch("tone", t)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                        draft.tone === t ? "bg-ink text-paper" : "border border-ink/15 text-ink/65 hover:border-ink/35"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Goal">
                <div className="grid gap-2 sm:grid-cols-3">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => patch("goal", goal.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        draft.goal === goal.id
                          ? "border-primary bg-primary/10"
                          : "border-ink/15 hover:border-ink/35"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{goal.label}</span>
                      <span className="block text-[11px] leading-snug text-ink/55">{goal.hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Welcome message">
                <textarea
                  className="input min-h-[60px]"
                  value={draft.welcome}
                  onChange={(e) => patch("welcome", e.target.value)}
                />
              </Field>
            </section>

            <section className="card space-y-3 p-6">
              <h2 className="font-display text-lg font-semibold">What it knows</h2>
              <p className="text-xs text-ink/50">
                Paste anything a great employee would know: services, pricing, hours, policies,
                shipping, your story. The bot answers from this — and only this.
              </p>
              <textarea
                className="input min-h-[160px]"
                placeholder={`Example:\nWe're a web design studio in Austin. Sites start at $1,500 and take 2-4 weeks. We also do logos ($400+) and monthly maintenance ($99/mo). Free 30-minute consult for new clients…`}
                value={draft.knowledge}
                onChange={(e) => patch("knowledge", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">FAQs</h3>
                <button
                  type="button"
                  onClick={() => patch("faq", [...draft.faq, { q: "", a: "" }])}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  + Add FAQ
                </button>
              </div>
              <div className="space-y-3">
                {draft.faq.map((f, i) => (
                  <div key={i} className="rounded-xl border border-ink/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">FAQ {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => patch("faq", draft.faq.filter((_, j) => j !== i))}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className="input mb-2"
                      placeholder="Question visitors ask"
                      value={f.q}
                      onChange={(e) =>
                        patch("faq", draft.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))
                      }
                    />
                    <textarea
                      className="input min-h-[50px]"
                      placeholder="How the bot should answer"
                      value={f.a}
                      onChange={(e) =>
                        patch("faq", draft.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Preview + embed */}
          <div className="space-y-5">
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Live preview</h2>
                <span className="text-xs text-ink/45">exactly what your visitors get</span>
              </div>
              <StreamChat
                key={`${draft.id}:${previewEpoch}`}
                endpoint="/api/widget/chat"
                body={{ botKey: draft.publicKey, visitorId: "preview" }}
                greeting={draft.welcome}
                suggestions={["What do you offer?", "How much does it cost?", "I'd like someone to contact me."]}
                placeholder="Chat as if you're a visitor…"
                persona={{ name: draft.name, emoji: "💬" }}
              />
              <p className="mt-2 text-xs text-ink/45">
                Preview chats count as conversations so you can see the whole pipeline — including
                lead capture — land in your dashboard.
              </p>
            </section>

            <section className="card p-6">
              <h2 className="font-display text-lg font-semibold">Add it to your website</h2>
              <p className="mt-1 text-sm text-ink/60">
                Paste this before <code className="rounded bg-ink/5 px-1">&lt;/body&gt;</code> on any
                site — WordPress, Shopify, Squarespace, Wix, or custom code.
              </p>
              <div className="mt-3 rounded-xl bg-ink p-4">
                <code className="block break-all font-mono text-xs leading-relaxed text-paper/90">
                  {embedSnippet}
                </code>
              </div>
              <button onClick={copyEmbed} className="btn-primary mt-3">
                {copied ? "Copied ✓" : "Copy snippet"}
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/70">{label}</span>
      {children}
    </label>
  );
}
