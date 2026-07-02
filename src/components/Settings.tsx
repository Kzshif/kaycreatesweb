"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Workspace } from "@/lib/types";

// Workspace settings — the business profile that feeds every AI surface
// (chatbot answers, SEO copy, lead replies, the pulse briefing).

export default function Settings() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/workspace", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setWorkspace(j.workspace))
      .catch(() => {});
  }, []);

  async function save() {
    if (!workspace) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workspace),
    });
    if (res.ok) {
      setWorkspace((await res.json()).workspace);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  function patch<K extends keyof Workspace>(key: K, value: Workspace[K]) {
    setWorkspace((w) => (w ? { ...w, [key]: value } : w));
  }

  if (!workspace) return <div className="h-96 animate-pulse rounded-2xl bg-ink/5" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Settings</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your business profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Everything here feeds your AI — the chatbot's answers, the SEO writer's copy, and your
            lead replies all speak with this context.
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      <section className="card max-w-2xl space-y-4 p-6">
        <Field label="Business name">
          <input className="input" value={workspace.name} onChange={(e) => patch("name", e.target.value)} />
        </Field>
        <Field label="Website">
          <input
            className="input"
            value={workspace.website}
            onChange={(e) => patch("website", e.target.value)}
            inputMode="url"
          />
        </Field>
        <Field label="About your business">
          <textarea
            className="input min-h-[140px]"
            placeholder="What you do, who you serve, what makes you different, your tone of voice…"
            value={workspace.about}
            onChange={(e) => patch("about", e.target.value)}
          />
        </Field>
        <p className="text-xs text-ink/45">
          Tip: the more specific this is, the better your{" "}
          <Link href="/app/bots" className="font-medium text-primary hover:underline">
            chatbot
          </Link>{" "}
          and{" "}
          <Link href="/app/seo" className="font-medium text-primary hover:underline">
            SEO writer
          </Link>{" "}
          sound like you.
        </p>
      </section>
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
