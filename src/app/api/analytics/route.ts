import { NextRequest, NextResponse } from "next/server";
import { planStatus } from "@/lib/billing";
import { dailySeries, workspaceStats } from "@/lib/convos";
import { listAudits } from "@/lib/seo";
import { tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 14));
  const [audits, stats, series, plan] = await Promise.all([
    listAudits(tenant.workspace.id, 1),
    workspaceStats(tenant.workspace.id),
    dailySeries(tenant.workspace.id, days),
    planStatus(tenant.workspace),
  ]);
  const latestAudit = audits[0] ?? null;
  return NextResponse.json({
    stats,
    series,
    plan,
    latestAudit: latestAudit
      ? { url: latestAudit.url, score: latestAudit.score, createdAt: latestAudit.createdAt }
      : null,
  });
}
