import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByEmail, sessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const user = body.email ? await findUserByEmail(body.email) : null;
  if (!user || !verifyPassword(body.password ?? "", user.passwordHash)) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}
