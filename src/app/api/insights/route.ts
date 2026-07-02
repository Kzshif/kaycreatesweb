import { NextRequest, NextResponse } from "next/server";
import { getBriefing } from "@/lib/insights";
import { tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const briefing = await getBriefing(tenant.practice, refresh);
  return NextResponse.json({ briefing });
}
