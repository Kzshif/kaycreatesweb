import { existsSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

// Shared SQLite handle for the whole app — events captured by the receptionist,
// plus the SaaS layer: users, sessions, practices (tenants), usage metering and
// invoices. The connection is memoised on globalThis so Next.js hot-reloads and
// concurrent route handlers share one handle.
//
// In production you'd point DATABASE_PATH at a managed database or swap this
// module for Postgres — the exported functions are the only contract.

const g = globalThis as unknown as { __frontdeskDb?: Database.Database };

// Candidate database locations, in order of preference. On a normal host we use
// ./data; on read-only serverless filesystems (e.g. Vercel) only /tmp is
// writable; :memory: is the last-resort fallback so the app never crashes.
function candidatePaths(): string[] {
  const paths: string[] = [];
  if (process.env.DATABASE_PATH) paths.push(process.env.DATABASE_PATH);
  if (!process.env.VERCEL) paths.push(join(process.cwd(), "data", "frontdesk.db"));
  paths.push("/tmp/frontdesk.db");
  paths.push(":memory:");
  return paths;
}

function open(path: string): Database.Database {
  if (path !== ":memory:") {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  const conn = new Database(path);
  conn.pragma("journal_mode = WAL");
  return conn;
}

export function getDb(): Database.Database {
  if (g.__frontdeskDb) return g.__frontdeskDb;

  let conn: Database.Database | undefined;
  for (const path of candidatePaths()) {
    try {
      conn = open(path);
      break;
    } catch (err) {
      console.warn(`[db] could not open ${path}: ${(err as Error).message}`);
    }
  }
  if (!conn) conn = new Database(":memory:");

  migrate(conn);
  g.__frontdeskDb = conn;
  return conn;
}

function migrate(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS events (
      seq        INTEGER PRIMARY KEY AUTOINCREMENT,
      id         TEXT UNIQUE NOT NULL,
      kind       TEXT NOT NULL,
      vertical   TEXT NOT NULL,
      createdAt  TEXT NOT NULL,
      name       TEXT NOT NULL,
      contact    TEXT NOT NULL,
      summary    TEXT NOT NULL,
      details    TEXT NOT NULL DEFAULT '{}',
      status     TEXT NOT NULL DEFAULT 'new'
    );

    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      email        TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token     TEXT PRIMARY KEY,
      userId    TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS practices (
      id          TEXT PRIMARY KEY,
      userId      TEXT NOT NULL,
      name        TEXT NOT NULL,
      vertical    TEXT NOT NULL,
      hours       TEXT NOT NULL,
      services    TEXT NOT NULL DEFAULT '[]',
      faq         TEXT NOT NULL DEFAULT '[]',
      greeting    TEXT NOT NULL,
      plan        TEXT NOT NULL DEFAULT 'trial',
      trialEndsAt TEXT NOT NULL,
      createdAt   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage (
      practiceId    TEXT NOT NULL,
      month         TEXT NOT NULL,
      conversations INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (practiceId, month)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id          TEXT PRIMARY KEY,
      practiceId  TEXT NOT NULL,
      description TEXT NOT NULL,
      amountCents INTEGER NOT NULL,
      createdAt   TEXT NOT NULL
    );
  `);

  // Column migrations for databases created before the SaaS layer existed.
  const eventCols = new Set(
    (conn.pragma("table_info(events)") as { name: string }[]).map((c) => c.name),
  );
  if (!eventCols.has("practiceId")) {
    conn.exec(`ALTER TABLE events ADD COLUMN practiceId TEXT`);
  }
  if (!eventCols.has("sentiment")) {
    conn.exec(`ALTER TABLE events ADD COLUMN sentiment TEXT NOT NULL DEFAULT 'neutral'`);
  }
  if (!eventCols.has("urgency")) {
    conn.exec(`ALTER TABLE events ADD COLUMN urgency INTEGER NOT NULL DEFAULT 2`);
  }
  if (!eventCols.has("intent")) {
    conn.exec(`ALTER TABLE events ADD COLUMN intent TEXT NOT NULL DEFAULT 'general'`);
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}
