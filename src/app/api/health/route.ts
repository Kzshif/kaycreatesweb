import { NextResponse } from "next/server";
import { q, usingPostgres } from "@/lib/db";
import { stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ops probe: which storage backend is live, and can we reach it?
export async function GET() {
  try {
    await q(`SELECT 1 AS ok`);
    return NextResponse.json({
      ok: true,
      db: usingPostgres ? "postgres" : "sqlite",
      persistent: usingPostgres,
      payments: stripeEnabled() ? "stripe" : "demo",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        db: usingPostgres ? "postgres" : "sqlite",
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
