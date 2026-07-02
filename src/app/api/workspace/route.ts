import { NextRequest, NextResponse } from "next/server";
import { tenantFromRequest } from "@/lib/tenant";
import { updateWorkspace } from "@/lib/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: tenant.user, workspace: tenant.workspace });
}

export async function PATCH(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; website?: string; about?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const patch: Parameters<typeof updateWorkspace>[1] = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.website === "string") patch.website = body.website.trim();
  if (typeof body.about === "string") patch.about = body.about.trim().slice(0, 2000);

  const workspace = updateWorkspace(tenant.workspace.id, patch);
  return NextResponse.json({ workspace });
}
