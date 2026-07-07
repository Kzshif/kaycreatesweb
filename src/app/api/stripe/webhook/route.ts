import { NextRequest, NextResponse } from "next/server";
import { newId, run } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe";
import { getWorkspace, setPlan } from "@/lib/workspaces";
import type { PlanId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe calls this after a customer pays through a Payment Link.
// checkout.session.completed carries client_reference_id (our workspaceId,
// added by the billing page) and metadata.plan (set on the Payment Link).

const PLANS = new Set<PlanId>(["launch", "grow", "scale"]);

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let event: {
    type?: string;
    data?: {
      object?: {
        client_reference_id?: string | null;
        metadata?: Record<string, string> | null;
        amount_total?: number | null;
        currency?: string | null;
        customer_details?: { email?: string | null } | null;
      };
    };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const workspaceId = session.client_reference_id ?? "";
    const plan = (session.metadata?.plan ?? "") as PlanId;

    if (workspaceId && PLANS.has(plan) && (await getWorkspace(workspaceId))) {
      await setPlan(workspaceId, plan);
      await run(
        `INSERT INTO invoices (id, workspaceId, description, amountCents, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newId("inv"),
          workspaceId,
          `NovaWebStudio — ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan (Stripe)`,
          session.amount_total ?? 0,
          new Date().toISOString(),
        ],
      );
      console.log(`[stripe] workspace ${workspaceId} upgraded to ${plan}`);
    } else {
      console.warn("[stripe] completed session missing workspace or plan", {
        workspaceId,
        plan,
      });
    }
  }

  // Acknowledge everything else so Stripe doesn't retry.
  return NextResponse.json({ received: true });
}
