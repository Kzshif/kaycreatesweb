import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanId } from "./types";

// Real payments via Stripe Payment Links + a signed webhook — no Stripe SDK
// and no secret API key needed at runtime.
//
// Configure three subscription Payment Links (one per plan, each created with
// metadata.plan = launch|grow|scale and an after-payment redirect back to
// /app/billing), then set:
//   STRIPE_LINK_LAUNCH / STRIPE_LINK_GROW / STRIPE_LINK_SCALE  — the buy.stripe.com URLs
//   STRIPE_WEBHOOK_SECRET — signing secret of a webhook endpoint pointing at
//                           /api/stripe/webhook (event: checkout.session.completed)
//
// The billing page sends the customer to the link with ?client_reference_id=
// <workspaceId>; the webhook flips that workspace's plan when Stripe confirms
// payment. Until the env vars exist, billing stays in simulated demo mode.

const LINKS: Record<Exclude<PlanId, "trial">, string | undefined> = {
  launch: process.env.STRIPE_LINK_LAUNCH,
  grow: process.env.STRIPE_LINK_GROW,
  scale: process.env.STRIPE_LINK_SCALE,
};

export function stripeEnabled(): boolean {
  return Boolean(LINKS.launch && LINKS.grow && LINKS.scale && process.env.STRIPE_WEBHOOK_SECRET);
}

/** The hosted Stripe payment page for a plan, tagged with the workspace. */
export function checkoutUrl(plan: Exclude<PlanId, "trial">, workspaceId: string): string | null {
  const base = LINKS[plan];
  if (!base) return null;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}client_reference_id=${encodeURIComponent(workspaceId)}`;
}

/**
 * Verify a Stripe webhook signature (Stripe-Signature: t=...,v1=...).
 * HMAC-SHA256 of `${t}.${payload}` with the endpoint's signing secret.
 */
export function verifyStripeSignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!sigHeader) return false;
  const parts = new Map(
    sigHeader.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()] as const;
    }),
  );
  const t = parts.get("t");
  const v1 = parts.get("v1");
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
