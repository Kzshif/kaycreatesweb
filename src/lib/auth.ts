import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getDb, newId } from "./db";
import type { User } from "./types";

// Cookie-session auth backed by SQLite. Passwords are hashed with scrypt
// (Node built-in — no extra dependency); sessions are opaque random tokens in
// an httpOnly cookie.

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

export function createUser(email: string, name: string, password: string): User {
  const db = getDb();
  const user: UserRow = {
    id: newId("usr"),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO users (id, email, name, passwordHash, createdAt)
     VALUES (@id, @email, @name, @passwordHash, @createdAt)`,
  ).run(user);
  return publicUser(user);
}

export function findUserByEmail(email: string): UserRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ?? null;
}

function publicUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt };
}

// --- sessions ---------------------------------------------------------------

export function createSession(userId: string): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  getDb()
    .prepare(`INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)`)
    .run(token, userId, new Date().toISOString(), expiresAt.toISOString());
  return { token, expiresAt };
}

export function destroySession(token: string) {
  getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

function userForToken(token: string | undefined): User | null {
  if (!token) return null;
  const db = getDb();
  const session = db.prepare(`SELECT * FROM sessions WHERE token = ?`).get(token) as
    | { userId: string; expiresAt: string }
    | undefined;
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.userId) as
    | UserRow
    | undefined;
  return row ? publicUser(row) : null;
}

/** For route handlers — reads the session cookie off the request. */
export function getUserFromRequest(req: NextRequest): User | null {
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
