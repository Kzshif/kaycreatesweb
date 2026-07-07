import { existsSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";

// NovaWebStudio data layer — one small async adapter, two backends:
//
//  - Postgres, whenever NETLIFY_DATABASE_URL (Netlify DB / Neon) or a
//    postgres:// DATABASE_URL is set. Uses Neon's HTTP driver, which works on
//    serverless hosts with zero socket/SSL configuration. This is the
//    permanent production store.
//  - better-sqlite3 otherwise (local dev and demo installs) — same behavior,
//    zero setup.
//
// All app code goes through q()/qOne()/run() with positional `?` params and
// SQL kept to the portable subset both engines accept. Postgres folds unquoted
// identifiers to lowercase, so rows coming back have their keys mapped to the
// camelCase names the app uses.

const PG_URL =
  process.env.NETLIFY_DATABASE_URL ||
  (process.env.DATABASE_URL?.startsWith("postgres") ? process.env.DATABASE_URL : "");

export const usingPostgres = Boolean(PG_URL);

type Row = Record<string, unknown>;

const SCHEMA = `
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
`;

// Postgres folds unquoted identifiers to lowercase; map result keys back to
// the camelCase the app was written with.
const CAMEL: Record<string, string> = {
  passwordhash: "passwordHash",
  createdat: "createdAt",
  userid: "userId",
  expiresat: "expiresAt",
  trialendsat: "trialEndsAt",
  workspaceid: "workspaceId",
  publickey: "publicKey",
  botid: "botId",
  visitorid: "visitorId",
  messagecount: "messageCount",
  startedat: "startedAt",
  lastmessageat: "lastMessageAt",
  suggestedtitle: "suggestedTitle",
  suggesteddescription: "suggestedDescription",
  amountcents: "amountCents",
};

function camelRow(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[CAMEL[k] ?? k] = v;
  return out;
}

/** `?` placeholders → Postgres `$1..$n`. (No literal `?` appears in our SQL.) */
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// --- Postgres backend (Neon HTTP driver) --------------------------------------

const g = globalThis as unknown as {
  __kcwPg?: import("@neondatabase/serverless").NeonQueryFunction<false, true>;
  __kcwPgReady?: Promise<void>;
  __kcwSqlite?: import("better-sqlite3").Database;
};

async function pg() {
  if (!g.__kcwPg) {
    const { neon } = await import("@neondatabase/serverless");
    g.__kcwPg = neon(PG_URL, { fullResults: true });
  }
  if (!g.__kcwPgReady) {
    const sql = g.__kcwPg;
    g.__kcwPgReady = (async () => {
      for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
        await sql.query(stmt);
      }
    })();
  }
  await g.__kcwPgReady;
  return g.__kcwPg;
}

// --- SQLite backend (local dev / demo) ----------------------------------------

function sqlite() {
  if (g.__kcwSqlite) return g.__kcwSqlite;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const candidates = [
    process.env.DATABASE_PATH,
    join(process.cwd(), "data", "kaycreatesweb.db"),
    "/tmp/kaycreatesweb.db",
    ":memory:",
  ].filter(Boolean) as string[];

  let conn: import("better-sqlite3").Database | undefined;
  for (const path of candidates) {
    try {
      if (path !== ":memory:") {
        const dir = dirname(path);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      }
      conn = new Database(path);
      conn.pragma("journal_mode = WAL");
      break;
    } catch (err) {
      console.warn(`[db] could not open ${path}: ${(err as Error).message}`);
    }
  }
  if (!conn) conn = new Database(":memory:");
  conn.exec(SCHEMA);
  g.__kcwSqlite = conn;
  return conn;
}

// --- The three calls the whole app uses -----------------------------------------

/** Run a SELECT; resolves to plain rows with camelCase keys. */
export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (usingPostgres) {
    const client = await pg();
    const res = await client.query(toPg(sql), params);
    return (res.rows as Row[]).map(camelRow) as T[];
  }
  return sqlite().prepare(sql).all(...(params as [])) as T[];
}

/** Run a SELECT expecting at most one row. */
export async function qOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

/** Run an INSERT/UPDATE/DELETE; resolves to the affected-row count. */
export async function run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
  if (usingPostgres) {
    const client = await pg();
    const res = await client.query(toPg(sql), params);
    return { changes: res.rowCount ?? 0 };
  }
  const info = sqlite().prepare(sql).run(...(params as []));
  return { changes: info.changes };
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}
