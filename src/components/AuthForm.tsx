"use client";

import { useState } from "react";
import Link from "next/link";
import { VERTICAL_LIST } from "@/lib/verticals";
import type { VerticalId } from "@/lib/types";

// Shared login / signup form. On success we hard-navigate so the server
// layout re-reads the session cookie.

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      window.location.href = "/app";
      return;
    }
    const json = await res.json().catch(() => ({}));
    setError(json.error ?? "Something went wrong — try again.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Work email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourpractice.com"
          className="input"
          autoComplete="email"
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input"
          autoComplete="current-password"
        />
      </Field>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full py-3 disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-ink/60">
        New to FrontDesk AI?{" "}
        <Link href="/signup" className="font-semibold text-teal hover:underline">
          Start your free trial
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ initialPlan }: { initialPlan?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [vertical, setVertical] = useState<VerticalId>("dental");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, practiceName, vertical, plan: initialPlan }),
    });
    if (res.ok) {
      window.location.href = "/app";
      return;
    }
    const json = await res.json().catch(() => ({}));
    setError(json.error ?? "Something went wrong — try again.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Kay Rivera"
            className="input"
            autoComplete="name"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourpractice.com"
            className="input"
            autoComplete="email"
          />
        </Field>
      </div>
      <Field label="Password (8+ characters)">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input"
          autoComplete="new-password"
        />
      </Field>
      <Field label="Practice name">
        <input
          required
          value={practiceName}
          onChange={(e) => setPracticeName(e.target.value)}
          placeholder="Brightwater Dental"
          className="input"
        />
      </Field>
      <Field label="Your specialty">
        <div className="grid grid-cols-2 gap-2">
          {VERTICAL_LIST.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVertical(v.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                vertical === v.id
                  ? "border-teal bg-teal/10 font-semibold text-ink"
                  : "border-ink/15 bg-white/60 text-ink/70 hover:border-ink/35"
              }`}
            >
              <span className="text-lg">{v.emoji}</span> {v.label}
            </button>
          ))}
        </div>
      </Field>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full py-3 disabled:opacity-60">
        {busy ? "Creating your receptionist…" : "Start my 14-day free trial"}
      </button>
      <p className="text-center text-xs text-ink/50">
        No credit card required. Robin starts answering the moment you sign up.
      </p>
      <p className="text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </form>
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
