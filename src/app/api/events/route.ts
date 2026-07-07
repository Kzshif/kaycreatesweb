import { NextRequest } from "next/server";
import { actionEvent, listEvents, stats } from "@/lib/store";
import type { VerticalId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const v = req.nextUrl.searchParams.get("vertical");
  const [events, s] = await Promise.all([
    listEvents((v as VerticalId) || undefined),
    stats(),
  ]);
  return Response.json({ events, stats: s });
}

// Mark an event as actioned (what a staff member would do after handling it).
export async function PATCH(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!body.id) return new Response("Missing id", { status: 400 });
  const evt = await actionEvent(body.id);
  if (!evt) return new Response("Not found", { status: 404 });
  return Response.json({ event: evt });
}
