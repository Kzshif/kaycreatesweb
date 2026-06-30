import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import type { CapturedEvent, CapturedKind, VerticalId } from "./types";

// SQLite-backed capture store. Everything the receptionist records
// (appointments, messages, callbacks) is persisted here so it survives server
// restarts. The connection is memoised on globalThis so Next.js hot-reloads and
// concurrent route handlers share one handle.
//
// In production you'd point DATABASE_PATH at a managed database or replace this
// module with your scheduling system / EHR integration.

type Row = {
  id: string;
  kind: CapturedKind;
  vertical: VerticalId;
  createdAt: string;
  name: string;
  contact: string;
  summary: string;
  details: string;
  status: "new" | "actioned";
};

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

function db(): Database.Database {
  if (g.__frontdeskDb) return g.__frontdeskDb;

  let conn: Database.Database | undefined;
  for (const path of candidatePaths()) {
    try {
      conn = open(path);
      break;
    } catch (err) {
      console.warn(`[store] could not open ${path}: ${(err as Error).message}`);
    }
  }
  if (!conn) conn = new Database(":memory:");

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
  `);

  g.__frontdeskDb = conn;
  seedIfEmpty(conn);
  return conn;
}

function toEvent(r: Row): CapturedEvent {
  return {
    id: r.id,
    kind: r.kind,
    vertical: r.vertical,
    createdAt: r.createdAt,
    name: r.name,
    contact: r.contact,
    summary: r.summary,
    details: safeParse(r.details),
    status: r.status,
  };
}

function safeParse(s: string): Record<string, string> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function addEvent(input: {
  kind: CapturedKind;
  vertical: VerticalId;
  name: string;
  contact: string;
  summary: string;
  details?: Record<string, string>;
  createdAt?: string;
}): CapturedEvent {
  const conn = db();
  const insert = conn.prepare(
    `INSERT INTO events (id, kind, vertical, createdAt, name, contact, summary, details, status)
     VALUES (@id, @kind, @vertical, @createdAt, @name, @contact, @summary, @details, 'new')`,
  );
  const update = conn.prepare(`UPDATE events SET id = @id WHERE seq = @seq`);

  const row = {
    id: "pending", // replaced with evt_<seq> below, in one transaction
    kind: input.kind,
    vertical: input.vertical,
    createdAt: input.createdAt ?? new Date().toISOString(),
    name: input.name || "Unknown caller",
    contact: input.contact || "—",
    summary: input.summary,
    details: JSON.stringify(input.details ?? {}),
  };

  const tx = conn.transaction(() => {
    const info = insert.run({ ...row, id: `tmp_${Math.random()}` });
    const seq = Number(info.lastInsertRowid);
    const id = `evt_${seq}`;
    update.run({ id, seq });
    return id;
  });
  const id = tx();

  return toEvent(conn.prepare(`SELECT * FROM events WHERE id = ?`).get(id) as Row);
}

export function listEvents(vertical?: VerticalId): CapturedEvent[] {
  const conn = db();
  const rows = vertical
    ? conn.prepare(`SELECT * FROM events WHERE vertical = ? ORDER BY seq DESC`).all(vertical)
    : conn.prepare(`SELECT * FROM events ORDER BY seq DESC`).all();
  return (rows as Row[]).map(toEvent);
}

export function actionEvent(eventId: string): CapturedEvent | null {
  const conn = db();
  const info = conn.prepare(`UPDATE events SET status = 'actioned' WHERE id = ?`).run(eventId);
  if (info.changes === 0) return null;
  return toEvent(conn.prepare(`SELECT * FROM events WHERE id = ?`).get(eventId) as Row);
}

export function stats() {
  const conn = db();
  const count = (where = "") =>
    Number((conn.prepare(`SELECT COUNT(*) AS c FROM events ${where}`).get() as { c: number }).c);
  return {
    total: count(),
    appointments: count(`WHERE kind = 'appointment'`),
    messages: count(`WHERE kind = 'message'`),
    callbacks: count(`WHERE kind = 'callback'`),
    unactioned: count(`WHERE status = 'new'`),
  };
}

// Seed a few rows so the dashboard isn't empty on first run.
function seedIfEmpty(conn: Database.Database) {
  const count = (conn.prepare(`SELECT COUNT(*) AS c FROM events`).get() as { c: number }).c;
  if (count > 0) return;

  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  const seeds: Omit<Row, "id">[] = [
    {
      kind: "appointment",
      vertical: "dental",
      createdAt: at(12),
      name: "Marcus Whitfield",
      contact: "07700 900173",
      summary: "Booked check-up & scale and polish",
      details: JSON.stringify({
        service: "Check-up & scale and polish",
        when: "Thursday at 10:30am",
        notes: "Existing patient, prefers mornings",
      }),
      status: "new",
    },
    {
      kind: "message",
      vertical: "dental",
      createdAt: at(41),
      name: "Priya Nair",
      contact: "priya.nair@example.co.uk",
      summary: "Toothache — possible emergency",
      details: JSON.stringify({
        urgency: "High",
        notes: "Sharp pain lower-left molar since last night, wants same-day if possible",
      }),
      status: "new",
    },
    {
      kind: "callback",
      vertical: "dental",
      createdAt: at(96),
      name: "Dale Owens",
      contact: "01635 900142",
      summary: "Denplan membership question",
      details: JSON.stringify({
        notes: "Wants to confirm Denplan covers a crown before booking",
      }),
      status: "actioned",
    },
  ];

  const insert = conn.prepare(
    `INSERT INTO events (id, kind, vertical, createdAt, name, contact, summary, details, status)
     VALUES (@id, @kind, @vertical, @createdAt, @name, @contact, @summary, @details, @status)`,
  );
  const update = conn.prepare(`UPDATE events SET id = @id WHERE seq = @seq`);
  const tx = conn.transaction(() => {
    for (const s of seeds.reverse()) {
      const info = insert.run({ ...s, id: `tmp_${Math.random()}` });
      const seq = Number(info.lastInsertRowid);
      update.run({ id: `evt_${1000 + seq}`, seq });
    }
  });
  tx();
}
