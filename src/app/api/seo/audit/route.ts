import { NextRequest, NextResponse } from "next/server";
import { auditPage, listAudits } from "@/lib/seo";
import { tenantFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ audits: await listAudits(tenant.workspace.id, 15) });
}

export async function POST(req: NextRequest) {
  const tenant = await tenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  let url: URL;
  try {
    const raw = (body.url ?? "").trim();
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }
  // Basic SSRF guard: block obvious internal targets.
  if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|\[::1\])/.test(url.hostname)) {
    return NextResponse.json({ error: "That host can't be audited." }, { status: 400 });
  }

  try {
    const audit = await auditPage(tenant.workspace, url.toString());
    return NextResponse.json({ audit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not fetch that page.";
    return NextResponse.json({ error: `Couldn't audit that URL — ${message}` }, { status: 422 });
  }
}
