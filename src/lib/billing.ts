import { getDb, newId } from "./db";
import { setPlan } from "./workspaces";
import type { Invoice, PlanId, Workspace } from "./types";

// Plans, usage metering, and (simulated) billing. Swap `upgrade()` for a
// Stripe Checkout session without touching the rest of the app.

export interface Plan {
  id: Exclude<PlanId, "trial">;
  name: string;
  priceMonthly: number; // dollars
  tagline: string;
  /** AI chatbot messages included per month; Infinity = unlimited. */
  messageLimit: number;
  /** Max bots. */
  botLimit: number;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "launch",
    name: "Launch",
    priceMonthly: 29,
    tagline: "One site, getting started",
    messageLimit: 500,
    botLimit: 1,
    features: [
      "1 AI chatbot",
      "500 chat messages / mo",
      "Lead capture inbox",
      "5 SEO audits / mo",
      "AI meta & keyword generator",
    ],
  },
  {
    id: "grow",
    name: "Grow",
    priceMonthly: 79,
    tagline: "Serious about turning visitors into customers",
    messageLimit: 3000,
    botLimit: 3,
    highlight: true,
    features: [
      "3 AI chatbots",
      "3,000 chat messages / mo",
      "Everything in Launch",
      "Unlimited SEO audits",
      "AI blog & landing-page writer",
      "AI weekly pulse briefing",
      "AI-drafted lead replies",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 199,
    tagline: "Agencies & multi-site businesses",
    messageLimit: 15000,
    botLimit: 10,
    features: [
      "10 AI chatbots",
      "15,000 chat messages / mo",
      "Everything in Grow",
      "Remove NOVA05 branding",
      "Priority support",
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1]; // trial runs on Grow-tier limits
}

function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export function getUsage(workspaceId: string): number {
  const row = getDb()
    .prepare(`SELECT messages FROM usage WHERE workspaceId = ? AND month = ?`)
    .get(workspaceId, monthKey()) as { messages: number } | undefined;
  return row?.messages ?? 0;
}

export function recordMessage(workspaceId: string) {
  getDb()
    .prepare(
      `INSERT INTO usage (workspaceId, month, messages) VALUES (?, ?, 1)
       ON CONFLICT(workspaceId, month) DO UPDATE SET messages = messages + 1`,
    )
    .run(workspaceId, monthKey());
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
  botLimit: number;
  overLimit: boolean;
}

export function planStatus(workspace: Workspace): PlanStatus {
  const onTrial = workspace.plan === "trial";
  const trialDaysLeft = Math.max(
    0,
    Math.ceil((new Date(workspace.trialEndsAt).getTime() - Date.now()) / 86_400_000),
  );
  const plan = getPlan(workspace.plan);
  const used = getUsage(workspace.id);
  const limit = plan.messageLimit === Infinity ? null : plan.messageLimit;
  return {
    plan: workspace.plan,
    planName: onTrial ? "Free trial" : plan.name,
    priceMonthly: onTrial ? 0 : plan.priceMonthly,
    onTrial,
    trialDaysLeft,
    trialExpired: onTrial && trialDaysLeft <= 0,
    used,
    limit,
    botLimit: plan.botLimit,
    overLimit: (onTrial && trialDaysLeft <= 0) || (limit !== null && used >= limit),
  };
}

/** Simulated checkout: switches the plan and books an invoice. */
export function upgrade(workspace: Workspace, planId: Plan["id"]): Invoice {
  const plan = getPlan(planId);
  setPlan(workspace.id, planId);
  const invoice: Invoice = {
    id: newId("inv"),
    workspaceId: workspace.id,
    description: `NovaWebStudio — ${plan.name} plan (monthly)`,
    amountCents: plan.priceMonthly * 100,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO invoices (id, workspaceId, description, amountCents, createdAt)
       VALUES (@id, @workspaceId, @description, @amountCents, @createdAt)`,
    )
    .run(invoice);
  return invoice;
}

export function listInvoices(workspaceId: string): Invoice[] {
  return getDb()
    .prepare(`SELECT * FROM invoices WHERE workspaceId = ? ORDER BY createdAt DESC`)
    .all(workspaceId) as Invoice[];
}
