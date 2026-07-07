import { NextRequest, NextResponse } from "next/server";
import { PLANS, listInvoices, planStatus, upgrade } from "@/lib/billing";
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
  return NextResponse.json({ status, plans: serializePlans(), invoices });
}

// Simulated checkout: switch plans and book an invoice. In production this
// endpoint would create a Stripe Checkout session instead.
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

  const invoice = await upgrade(tenant.workspace, plan.id);
  const refreshed = { ...tenant.workspace, plan: plan.id };
  return NextResponse.json({
    status: await planStatus(refreshed),
    invoice,
  });
}
