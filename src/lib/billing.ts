import { getDb, newId } from "./db";
import { setPlan } from "./practices";
import type { Invoice, PlanId, Practice } from "./types";

// Plans, usage metering, and (simulated) billing. Swap `upgrade()` for a
// Stripe Checkout session without touching the rest of the app.

export interface Plan {
  id: Exclude<PlanId, "trial">;
  name: string;
  priceMonthly: number; // dollars
  tagline: string;
  conversationLimit: number; // per month; Infinity = unlimited
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 149,
    tagline: "Single-provider practice",
    conversationLimit: 300,
    features: [
      "300 conversations / mo",
      "Web chat + phone answering",
      "Appointments, messages & callbacks",
      "AI triage on every call",
      "Staff inbox & analytics",
    ],
  },
  {
    id: "practice",
    name: "Practice",
    priceMonthly: 399,
    tagline: "Growing multi-provider clinic",
    conversationLimit: 1500,
    highlight: true,
    features: [
      "1,500 conversations / mo",
      "Everything in Starter",
      "AI daily briefing",
      "Front-desk Copilot",
      "AI-drafted replies",
      "Priority support",
    ],
  },
  {
    id: "group",
    name: "Group",
    priceMonthly: 899,
    tagline: "Multi-site group / DSO",
    conversationLimit: Infinity,
    features: [
      "Unlimited conversations",
      "Everything in Practice",
      "Multiple locations",
      "EHR / PMS integration support",
      "Dedicated success manager",
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1]; // trial runs on Practice-tier limits
}

function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export function getUsage(practiceId: string): number {
  const row = getDb()
    .prepare(`SELECT conversations FROM usage WHERE practiceId = ? AND month = ?`)
    .get(practiceId, monthKey()) as { conversations: number } | undefined;
  return row?.conversations ?? 0;
}

export function recordConversation(practiceId: string) {
  getDb()
    .prepare(
      `INSERT INTO usage (practiceId, month, conversations) VALUES (?, ?, 1)
       ON CONFLICT(practiceId, month) DO UPDATE SET conversations = conversations + 1`,
    )
    .run(practiceId, monthKey());
}

export interface PlanStatus {
  plan: PlanId;
  planName: string;
  priceMonthly: number;
  onTrial: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  used: number;
  limit: number | null; // null = unlimited
  overLimit: boolean;
}

export function planStatus(practice: Practice): PlanStatus {
  const onTrial = practice.plan === "trial";
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((new Date(practice.trialEndsAt).getTime() - Date.now()) / 86_400_000),
  );
  const plan = getPlan(practice.plan);
  const used = getUsage(practice.id);
  const limit = plan.conversationLimit === Infinity ? null : plan.conversationLimit;
  return {
    plan: practice.plan,
    planName: onTrial ? "Free trial" : plan.name,
    priceMonthly: onTrial ? 0 : plan.priceMonthly,
    onTrial,
    trialDaysLeft,
    trialExpired: onTrial && trialDaysLeft <= 0,
    used,
    limit,
    overLimit: (onTrial && trialDaysLeft <= 0) || (limit !== null && used >= limit),
  };
}

/** Simulated checkout: switches the plan and books an invoice. */
export function upgrade(practice: Practice, planId: Plan["id"]): Invoice {
  const plan = getPlan(planId);
  setPlan(practice.id, planId);
  const invoice: Invoice = {
    id: newId("inv"),
    practiceId: practice.id,
    description: `FrontDesk AI — ${plan.name} plan (monthly)`,
    amountCents: plan.priceMonthly * 100,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO invoices (id, practiceId, description, amountCents, createdAt)
       VALUES (@id, @practiceId, @description, @amountCents, @createdAt)`,
    )
    .run(invoice);
  return invoice;
}

export function listInvoices(practiceId: string): Invoice[] {
  return getDb()
    .prepare(`SELECT * FROM invoices WHERE practiceId = ? ORDER BY createdAt DESC`)
    .all(practiceId) as Invoice[];
}
