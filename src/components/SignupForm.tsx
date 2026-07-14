"use client";

import { useState } from "react";
import Link from "next/link";

const INTERESTS = [
  { id: "website", label: "A website", hint: "Design, copy and hosting sorted for you" },
  { id: "receptionist", label: "AI receptionist", hint: "Robin answers your calls & chat 24/7" },
  { id: "both", label: "Both", hint: "A website with the receptionist built in" },
];

export function SignupForm({ defaultPlan, defaultInterest }: { defaultPlan?: string; defaultInterest?: string }) {
  const [interest, setInterest] = useState(
    INTERESTS.some((i) => i.id === defaultInterest) ? (defaultInterest as string) : "website",
  );
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        business: fd.get("business"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        message: fd.get("message"),
        company_url: fd.get("company_url"),
        interest,
        plan: defaultPlan ?? "",
      }),
    }).catch(() => null);
    setSending(false);
    if (res?.ok) {
      setDone(true);
    } else {
      const j = res ? await res.json().catch(() => null) : null;
      setError(j?.error ?? "Something went wrong — please try again.");
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl">🎉</span>
        <h2 className="mt-4 font-display text-2xl font-semibold text-white">You&apos;re signed up.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
          Thanks — we&apos;ve got your details. Within one working day we&apos;ll send you a
          personal demo built around your business (no card, nothing to cancel).
          If it&apos;s not for you, that&apos;s the end of it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/demo" className="btn-primary">Try the receptionist meanwhile →</Link>
          <Link href="/" className="btn-ghost">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-white">What do you need?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {INTERESTS.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setInterest(i.id)}
              className={`rounded-xl border p-3 text-left transition ${
                interest === i.id
                  ? "border-cyan/60 bg-cyan/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <span className="block text-sm font-semibold text-white">{i.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-400">{i.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required placeholder="Sam Taylor" />
        <Field label="Business name" name="business" required placeholder="Taylor's Bakery" />
        <Field label="Email" name="email" type="email" required placeholder="sam@example.co.uk" />
        <Field label="Phone (optional)" name="phone" type="tel" placeholder="07700 900000" />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">
          Anything we should know? <span className="text-slate-500">(optional)</span>
        </span>
        <textarea
          name="message"
          rows={3}
          placeholder="e.g. We're a café with just a Facebook page — we'd like a site with our menu on it."
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan/50 focus:outline-none"
        />
      </label>

      {/* Honeypot — hidden from real users */}
      <input type="text" name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {error && <p className="text-sm text-amber-accent">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={sending} className="btn-primary px-7 py-3 disabled:opacity-60">
          {sending ? "Sending…" : "Sign up — no card needed"}
        </button>
        <p className="text-xs leading-snug text-slate-500">
          No payment, no trial clock. We&apos;ll reply personally with a demo made
          for your business.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan/50 focus:outline-none"
      />
    </label>
  );
}
