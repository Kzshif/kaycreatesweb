import { NextRequest, NextResponse } from "next/server";
import { planStatus } from "@/lib/billing";
import { dailySeries, intentBreakdown, stats } from "@/lib/store";
import { tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 14));
  return NextResponse.json({
    stats: stats(tenant.practice.id),
    series: dailySeries(tenant.practice.id, days),
    intents: intentBreakdown(tenant.practice.id, days),
    plan: planStatus(tenant.practice),
  });
}
