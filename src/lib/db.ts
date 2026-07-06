import { existsSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

// NovaWebStudio — shared SQLite handle for the whole platform: users & sessions, workspaces
// (tenants), bots, conversations, leads, SEO audits, usage metering, and
// invoices. Memoised on globalThis so Next.js hot-reloads and concurrent route
// handlers share one connection.
//
// In production you'd point DATABASE_PATH at a managed database or swap this
// module for Postgres — the exported functions are the only contract.

const g = globalThis as unknown as { __kcwDb?: Database.Database };

// Candidate database locations, in order of preference. On a normal host we use
// ./data; on read-only serverless filesystems (e.g. Vercel) only /tmp is
// writable; :memory: is the last-resort fallback so the app never crashes.
function candidatePaths(): string[] {
  const paths: string[] = [];
  if (process.env.DATABASE_PATH) paths.push(process.env.DATABASE_PATH);
  if (!process.env.VERCEL) paths.push(join(process.cwd(), "data", "kaycreatesweb.db"));
  paths.push("/tmp/kaycreatesweb.db");
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
  if (g.__kcwDb) return g.__kcwDb;

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
  g.__kcwDb = conn;
  return conn;
}

function migrate(conn: Database.Database) {
  conn.exec(`
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

    CREATE TABLE IF NOT EXISTS workspaces (
      id          TEXT PRIMARY KEY,
      userId      TEXT NOT NULL,
      name        TEXT NOT NULL,
      website     TEXT NOT NULL DEFAULT '',
      about       TEXT NOT NULL DEFAULT '',
      plan        TEXT NOT NULL DEFAULT 'trial',
      trialEndsAt TEXT NOT NULL,
      createdAt   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bots (
      id          TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      publicKey   TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      tone        TEXT NOT NULL DEFAULT 'friendly',
      goal        TEXT NOT NULL DEFAULT 'leads',
      welcome     TEXT NOT NULL,
      knowledge   TEXT NOT NULL DEFAULT '',
      faq         TEXT NOT NULL DEFAULT '[]',
      color       TEXT NOT NULL DEFAULT '#3b5bdb',
      createdAt   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id            TEXT PRIMARY KEY,
      botId         TEXT NOT NULL,
      workspaceId   TEXT NOT NULL,
      visitorId     TEXT NOT NULL,
      transcript    TEXT NOT NULL DEFAULT '[]',
      messageCount  INTEGER NOT NULL DEFAULT 0,
      startedAt     TEXT NOT NULL,
      lastMessageAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_convos_ws ON conversations (workspaceId, lastMessageAt);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_convos_visitor ON conversations (botId, visitorId);

    CREATE TABLE IF NOT EXISTS leads (
      id          TEXT PRIMARY KEY,
      botId       TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      message     TEXT NOT NULL,
      source      TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'new',
      createdAt   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leads_ws ON leads (workspaceId, createdAt);

    CREATE TABLE IF NOT EXISTS seo_audits (
      id                   TEXT PRIMARY KEY,
      workspaceId          TEXT NOT NULL,
      url                  TEXT NOT NULL,
      score                INTEGER NOT NULL,
      checks               TEXT NOT NULL DEFAULT '[]',
      recommendations      TEXT NOT NULL DEFAULT '[]',
      suggestedTitle       TEXT NOT NULL DEFAULT '',
      suggestedDescription TEXT NOT NULL DEFAULT '',
      mode                 TEXT NOT NULL DEFAULT 'fallback',
      createdAt            TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage (
      workspaceId TEXT NOT NULL,
      month       TEXT NOT NULL,
      messages    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (workspaceId, month)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id          TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      description TEXT NOT NULL,
      amountCents INTEGER NOT NULL,
      createdAt   TEXT NOT NULL
    );
  `);
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}
