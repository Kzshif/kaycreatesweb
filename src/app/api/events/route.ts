import { NextRequest } from "next/server";
import { actionEvent, listEvents, stats } from "@/lib/store";
import { tenantFromRequest } from "@/lib/tenant";
import type { VerticalId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Authenticated requests see their own practice's events; anonymous requests
// see the public demo queue (rows with no practiceId). Tenant data is never
// served without a session.
export async function GET(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  const scoped = req.nextUrl.searchParams.get("scope") === "practice" && tenant;
  const practiceId = scoped ? tenant.practice.id : null;
  const v = req.nextUrl.searchParams.get("vertical");
  const events = listEvents({
    vertical: (v as VerticalId) || undefined,
    practiceId,
  });
  return Response.json({ events, stats: stats(practiceId) });
}

// Mark an event as actioned (what a staff member would do after handling it).
export async function PATCH(req: NextRequest) {
  let body: { id?: string; scope?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!body.id) return new Response("Missing id", { status: 400 });

  const tenant = tenantFromRequest(req);
  const practiceId = body.scope === "practice" && tenant ? tenant.practice.id : null;
  const evt = actionEvent(body.id, practiceId);
  if (!evt) return new Response("Not found", { status: 404 });
  return Response.json({ event: evt });
}
