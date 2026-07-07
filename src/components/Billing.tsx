"use client";

import { useCallback, useEffect, useState } from "react";
import type { Invoice, PlanId } from "@/lib/types";

interface WirePlan {
  id: Exclude<PlanId, "trial">;
  name: string;
  priceMonthly: number;
  tagline: string;
  messageLimit: number | null;
  features: string[];
  highlight?: boolean;
}

interface WireStatus {
  plan: PlanId;
  planName: string;
  priceMonthly: number;
  onTrial: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  used: number;
  limit: number | null;
  overLimit: boolean;
}

export default function Billing() {
  const [plans, setPlans] = useState<WirePlan[]>([]);
  const [status, setStatus] = useState<WireStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [stripe, setStripe] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setPlans(json.plans);
      setStatus(json.status);
      setInvoices(json.invoices);
      setStripe(Boolean(json.stripe));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function choose(planId: string) {
    setBusyPlan(planId);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.checkoutUrl) {
      // Real payments: hand off to Stripe's hosted checkout.
      window.location.href = json.checkoutUrl;
      return;
    }
    await load();
    setBusyPlan(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Plan & billing</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Pays for itself with one lead.
        </h1>
        {status && (
          <p className="mt-2 text-sm text-ink/60">
            {status.onTrial
              ? status.trialExpired
                ? "Your free trial has ended — pick a plan to keep your chatbot answering."
                : `You're on the free trial with ${status.trialDaysLeft} day${
                    status.trialDaysLeft === 1 ? "" : "s"
                  } left. ${status.used} chat message${status.used === 1 ? "" : "s"} used this month.`
              : `You're on the ${status.planName} plan — ${status.used}${
                  status.limit ? ` of ${status.limit}` : ""
                } chat messages used this month.`}
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((p) => {
          const current = status?.plan === p.id;
          return (
            <div
              key={p.id}
              className={`card flex flex-col p-7 ${p.highlight ? "ring-2 ring-primary" : ""}`}
            >
              {p.highlight && (
                <span className="mb-3 inline-block w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-paper">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="text-sm text-ink/55">{p.tagline}</p>
              <p className="mt-4 font-display text-4xl font-semibold">
                ${p.priceMonthly}
                <span className="text-base font-normal text-ink/50">/mo</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink/70">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(p.id)}
                disabled={current || busyPlan !== null}
                className={`mt-7 ${p.highlight ? "btn-primary" : "btn-ghost"} disabled:opacity-60`}
              >
                {current
                  ? "Current plan ✓"
                  : busyPlan === p.id
                    ? "Switching…"
                    : status?.onTrial
                      ? `Choose ${p.name}`
                      : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-ink/10 px-6 py-4 font-display text-lg font-semibold">
          Invoices
        </h2>
        {invoices.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink/50">
            No invoices yet — you're on the free trial.
          </p>
        ) : (
          <ul className="divide-y divide-ink/[0.07]">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm">
                <div>
                  <p className="font-medium">{inv.description}</p>
                  <p className="text-xs text-ink/45">
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · {inv.id}
                  </p>
                </div>
                <p className="font-semibold">${(inv.amountCents / 100).toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-ink/40">
        {stripe
          ? "Payments are processed securely by Stripe. Your plan activates automatically after checkout."
          : "Demo billing: switching plans books an invoice locally instead of charging a card. Connect Stripe payment links to take real payments."}
      </p>
    </div>
  );
}
