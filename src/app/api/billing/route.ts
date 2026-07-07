import { NextRequest, NextResponse } from "next/server";
import { PLANS, listInvoices, planStatus, upgrade } from "@/lib/billing";
import { checkoutUrl, stripeEnabled } from "@/lib/stripe";
import { tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Plans are serialized with Infinity → null so JSON round-trips cleanly.
function serializePlans() {
  return PLANS.map((p) => ({
    ...p,
    messageLimit: p.messageLimit === Infinity ? null : p.messageLimit,
  }));
}

export async function GET(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [status, invoices] = await Promise.all([
    planStatus(tenant.workspace),
    listInvoices(tenant.workspace.id),
  ]);
  return NextResponse.json({ status, plans: serializePlans(), invoices, stripe: stripeEnabled() });
}

// Checkout. With Stripe configured (payment links + webhook secret) this
// returns the hosted Stripe payment page for the plan; the webhook at
// /api/stripe/webhook activates it after payment. Without Stripe it falls
// back to the simulated demo flow.
export async function POST(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const plan = PLANS.find((p) => p.id === body.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  if (stripeEnabled()) {
    const url = checkoutUrl(plan.id, tenant.workspace.id);
    if (url) return NextResponse.json({ checkoutUrl: url });
  }

  const invoice = await upgrade(tenant.workspace, plan.id);
  const refreshed = { ...tenant.workspace, plan: plan.id };
  return NextResponse.json({
    status: await planStatus(refreshed),
    invoice,
  });
}
