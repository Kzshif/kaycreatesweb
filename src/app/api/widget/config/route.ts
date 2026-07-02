import { NextRequest } from "next/server";
import { getBotByKey } from "@/lib/bots";
import { DEMO_BOT } from "@/lib/demo-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public bot appearance config for the widget (name, welcome, color only —
// knowledge and internal ids never leave the server).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("bot") ?? "";
  const bot = key === "demo" ? DEMO_BOT : getBotByKey(key);
  if (!bot) return new Response("Unknown bot", { status: 404, headers: CORS });
  return Response.json(
    { name: bot.name, welcome: bot.welcome, color: bot.color },
    { headers: CORS },
  );
}
