"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VERTICAL_LIST } from "@/lib/verticals";
import type { Practice, VerticalId } from "@/lib/types";

// Receptionist configuration — everything Robin knows about the practice.

export default function Settings() {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/practice", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPractice(j.practice))
      .catch(() => {});
  }, []);

  async function save() {
    if (!practice) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/practice", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(practice),
    });
    if (res.ok) {
      setPractice((await res.json()).practice);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  function patch<K extends keyof Practice>(key: K, value: Practice[K]) {
    setPractice((p) => (p ? { ...p, [key]: value } : p));
  }

  if (!practice) {
    return <div className="h-96 animate-pulse rounded-2xl bg-ink/5" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Settings</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Teach Robin your practice.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Everything below flows straight into your receptionist's brain. Change it, then try it
            in the{" "}
            <Link href="/app/console" className="font-medium text-teal hover:underline">
              test console
            </Link>
            .
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Practice</h2>
          <Field label="Practice name">
            <input
              className="input"
              value={practice.name}
              onChange={(e) => patch("name", e.target.value)}
            />
          </Field>
          <Field label="Specialty">
            <div className="grid grid-cols-2 gap-2">
              {VERTICAL_LIST.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => patch("vertical", v.id as VerticalId)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    practice.vertical === v.id
                      ? "border-teal bg-teal/10 font-semibold"
                      : "border-ink/15 text-ink/70 hover:border-ink/35"
                  }`}
                >
                  <span>{v.emoji}</span> {v.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Hours (read to callers verbatim)">
            <input
              className="input"
              value={practice.hours}
              onChange={(e) => patch("hours", e.target.value)}
            />
          </Field>
          <Field label="Greeting">
            <textarea
              className="input min-h-[70px]"
              value={practice.greeting}
              onChange={(e) => patch("greeting", e.target.value)}
            />
          </Field>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Services Robin can book</h2>
          <p className="text-xs text-ink/50">One per line.</p>
          <textarea
            className="input min-h-[180px] font-mono text-xs"
            value={practice.services.join("\n")}
            onChange={(e) => patch("services", e.target.value.split("\n"))}
          />
        </section>

        <section className="card space-y-4 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">FAQs Robin answers</h2>
            <button
              type="button"
              onClick={() => patch("faq", [...practice.faq, { q: "", a: "" }])}
              className="text-sm font-semibold text-teal hover:underline"
            >
              + Add FAQ
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {practice.faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-ink/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                    FAQ {i + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      patch(
                        "faq",
                        practice.faq.filter((_, j) => j !== i),
                      )
                    }
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="input mb-2"
                  placeholder="Question callers ask"
                  value={f.q}
                  onChange={(e) =>
                    patch(
                      "faq",
                      practice.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)),
                    )
                  }
                />
                <textarea
                  className="input min-h-[60px]"
                  placeholder="How Robin should answer"
                  value={f.a}
                  onChange={(e) =>
                    patch(
                      "faq",
                      practice.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </div>
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
