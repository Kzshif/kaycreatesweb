import { NextRequest, NextResponse } from "next/server";
import { createSession, createUser, findUserByEmail, sessionCookie } from "@/lib/auth";
import { createPractice } from "@/lib/practices";
import { getVertical } from "@/lib/verticals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    name?: string;
    password?: string;
    practiceName?: string;
    vertical?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() ?? "";
  const password = body.password ?? "";
  const practiceName = body.practiceName?.trim() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Tell us your name." }, { status: 400 });
  }
  if (!practiceName) {
    return NextResponse.json({ error: "Tell us your practice's name." }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with that email already exists — log in instead." },
      { status: 409 },
    );
  }

  const user = createUser(email, name, password);
  const practice = createPractice(user.id, practiceName, getVertical(body.vertical).id);
  const { token, expiresAt } = createSession(user.id);

  const res = NextResponse.json({ user, practice });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}
