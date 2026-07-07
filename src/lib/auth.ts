import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { newId, q, qOne, run } from "./db";
import type { User } from "./types";

// Cookie-session auth. Passwords are hashed with scrypt (Node built-in — no
// extra dependency); sessions are opaque random tokens in an httpOnly cookie.

export const SESSION_COOKIE = "fd_session";
const SESSION_DAYS = 30;

type UserRow = User & { passwordHash: string };

// --- passwords --------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// --- users ------------------------------------------------------------------

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const user: UserRow = {
    id: newId("usr"),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await run(
    `INSERT INTO users (id, email, name, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [user.id, user.email, user.name, user.passwordHash, user.createdAt],
  );
  return publicUser(user);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return qOne<UserRow>(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()]);
}

function publicUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt };
}

// --- sessions ---------------------------------------------------------------

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await run(`INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)`, [
    token,
    userId,
    new Date().toISOString(),
    expiresAt.toISOString(),
  ]);
  return { token, expiresAt };
}

export async function destroySession(token: string) {
  await run(`DELETE FROM sessions WHERE token = ?`, [token]);
}

async function userForToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const session = await qOne<{ userId: string; expiresAt: string }>(
    `SELECT * FROM sessions WHERE token = ?`,
    [token],
  );
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroySession(token);
    return null;
  }
  const row = await qOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [session.userId]);
  return row ? publicUser(row) : null;
}

/** For route handlers — reads the session cookie off the request. */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  return userForToken(req.cookies.get(SESSION_COOKIE)?.value);
}

/** For server components — reads the session cookie from next/headers. */
export async function getUser(): Promise<User | null> {
  const jar = await cookies();
  return userForToken(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}
