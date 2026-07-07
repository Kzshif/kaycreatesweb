import { NextRequest, NextResponse } from "next/server";
import { planStatus } from "@/lib/billing";
import { createBot, deleteBot, listBots, updateBot } from "@/lib/bots";
import { tenantFromRequest } from "@/lib/tenant";
import type { Bot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ bots: await listBots(tenant.workspace.id) });
}

export async function POST(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await planStatus(tenant.workspace);
  if ((await listBots(tenant.workspace.id)).length >= status.botLimit) {
    return NextResponse.json(
      { error: `Your plan includes ${status.botLimit} bot${status.botLimit === 1 ? "" : "s"} — upgrade to add more.` },
      { status: 402 },
    );
  }

  let body: Partial<Bot>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const bot = await createBot(tenant.workspace, sanitize(body));
  return NextResponse.json({ bot });
}

export async function PATCH(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<Bot> & { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing bot id" }, { status: 400 });

  const bot = await updateBot(body.id, tenant.workspace.id, sanitize(body));
  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bot });
}

export async function DELETE(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing bot id" }, { status: 400 });
  if (!(await deleteBot(id, tenant.workspace.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

function sanitize(body: Partial<Bot>) {
  const patch: Partial<Pick<Bot, "name" | "tone" | "goal" | "welcome" | "knowledge" | "faq" | "color">> = {};
  if (typeof body.name === "string") patch.name = body.name.slice(0, 60);
  if (typeof body.tone === "string") patch.tone = body.tone;
  if (typeof body.goal === "string") patch.goal = body.goal;
  if (typeof body.welcome === "string") patch.welcome = body.welcome.slice(0, 300);
  if (typeof body.knowledge === "string") patch.knowledge = body.knowledge.slice(0, 8000);
  if (typeof body.color === "string") patch.color = body.color;
  if (Array.isArray(body.faq)) {
    patch.faq = body.faq
      .filter(
        (f): f is { q: string; a: string } =>
          !!f && typeof f.q === "string" && typeof f.a === "string" && !!f.q.trim() && !!f.a.trim(),
      )
      .map((f) => ({ q: f.q.trim().slice(0, 200), a: f.a.trim().slice(0, 1000) }))
      .slice(0, 20);
  }
  return patch;
}
