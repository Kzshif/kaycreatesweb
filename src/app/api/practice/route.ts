import { NextRequest, NextResponse } from "next/server";
import { updatePractice } from "@/lib/practices";
import { tenantFromRequest } from "@/lib/tenant";
import { getVertical } from "@/lib/verticals";
import type { Practice } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: tenant.user, practice: tenant.practice });
}

export async function PATCH(req: NextRequest) {
  const tenant = tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<Practice>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const patch: Parameters<typeof updatePractice>[1] = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.vertical === "string") patch.vertical = getVertical(body.vertical).id;
  if (typeof body.hours === "string" && body.hours.trim()) patch.hours = body.hours.trim();
  if (typeof body.greeting === "string" && body.greeting.trim()) patch.greeting = body.greeting.trim();
  if (Array.isArray(body.services)) {
    patch.services = body.services
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (Array.isArray(body.faq)) {
    patch.faq = body.faq
      .filter(
        (f): f is { q: string; a: string } =>
          !!f && typeof f.q === "string" && typeof f.a === "string" && !!f.q.trim() && !!f.a.trim(),
      )
      .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
      .slice(0, 12);
  }

  const practice = updatePractice(tenant.practice.id, patch);
  return NextResponse.json({ practice });
}
