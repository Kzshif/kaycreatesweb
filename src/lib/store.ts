import type Database from "better-sqlite3";
import { getDb } from "./db";
import { triageEvent } from "./triage";
import type { CapturedEvent, CapturedKind, Sentiment, VerticalId } from "./types";

// SQLite-backed capture store. Everything the receptionist records
// (appointments, messages, callbacks) is persisted here so it survives server
// restarts. Rows are scoped to a practice; rows with a NULL practiceId belong
// to the public demo so tenant data never leaks into it.

type Row = {
  id: string;
  kind: CapturedKind;
  vertical: VerticalId;
  practiceId: string | null;
  createdAt: string;
  name: string;
  contact: string;
  summary: string;
  details: string;
  status: "new" | "actioned";
  sentiment: Sentiment;
  urgency: number;
  intent: string;
};

let seeded = false;

function db(): Database.Database {
  const conn = getDb();
  if (!seeded) {
    seeded = true; // set before seeding — addEvent() below re-enters db()
    seedDemoIfEmpty(conn);
  }
  return conn;
}

function toEvent(r: Row): CapturedEvent {
  return {
    id: r.id,
    kind: r.kind,
    vertical: r.vertical,
    practiceId: r.practiceId,
    createdAt: r.createdAt,
    name: r.name,
    contact: r.contact,
    summary: r.summary,
    details: safeParse(r.details),
    status: r.status,
    sentiment: r.sentiment,
    urgency: r.urgency,
    intent: r.intent,
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
  practiceId?: string | null;
  name: string;
  contact: string;
  summary: string;
  details?: Record<string, string>;
  createdAt?: string;
}): CapturedEvent {
  const conn = db();
  const insert = conn.prepare(
    `INSERT INTO events (id, kind, vertical, practiceId, createdAt, name, contact, summary, details, status, sentiment, urgency, intent)
     VALUES (@id, @kind, @vertical, @practiceId, @createdAt, @name, @contact, @summary, @details, 'new', @sentiment, @urgency, @intent)`,
  );
  const update = conn.prepare(`UPDATE events SET id = @id WHERE seq = @seq`);

  const details = input.details ?? {};
  const triage = triageEvent(
    input.kind,
    input.summary,
    Object.values(details).join(" "),
  );

  const row = {
    kind: input.kind,
    vertical: input.vertical,
    practiceId: input.practiceId ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
    name: input.name || "Unknown caller",
    contact: input.contact || "—",
    summary: input.summary,
    details: JSON.stringify(details),
    ...triage,
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

// practiceId === undefined/null → the public demo (rows with NULL practiceId).
export function listEvents(opts: { vertical?: VerticalId; practiceId?: string | null } = {}): CapturedEvent[] {
  const conn = db();
  const scope = opts.practiceId ? `practiceId = @practiceId` : `practiceId IS NULL`;
  const where = opts.vertical ? `${scope} AND vertical = @vertical` : scope;
  const rows = conn
    .prepare(`SELECT * FROM events WHERE ${where} ORDER BY seq DESC`)
    .all({ practiceId: opts.practiceId, vertical: opts.vertical });
  return (rows as Row[]).map(toEvent);
}

export function getEvent(eventId: string): CapturedEvent | null {
  const row = db().prepare(`SELECT * FROM events WHERE id = ?`).get(eventId) as Row | undefined;
  return row ? toEvent(row) : null;
}

export function actionEvent(eventId: string, practiceId?: string | null): CapturedEvent | null {
  const conn = db();
  const scope = practiceId ? `AND practiceId = ?` : `AND practiceId IS NULL`;
  const args = practiceId ? [eventId, practiceId] : [eventId];
  const info = conn.prepare(`UPDATE events SET status = 'actioned' WHERE id = ? ${scope}`).run(...args);
  if (info.changes === 0) return null;
  return toEvent(conn.prepare(`SELECT * FROM events WHERE id = ?`).get(eventId) as Row);
}

export function stats(practiceId?: string | null) {
  const conn = db();
  const scope = practiceId ? `practiceId = @practiceId` : `practiceId IS NULL`;
  const count = (extra = "") =>
    Number(
      (conn
        .prepare(`SELECT COUNT(*) AS c FROM events WHERE ${scope} ${extra}`)
        .get({ practiceId }) as { c: number }).c,
    );
  return {
    total: count(),
    appointments: count(`AND kind = 'appointment'`),
    messages: count(`AND kind = 'message'`),
    callbacks: count(`AND kind = 'callback'`),
    unactioned: count(`AND status = 'new'`),
    urgent: count(`AND urgency >= 4 AND status = 'new'`),
  };
}

/** Events per day for the last `days` days, split by kind — feeds the charts. */
export function dailySeries(practiceId: string | null, days: number) {
  const conn = db();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const scope = practiceId ? `practiceId = @practiceId` : `practiceId IS NULL`;
  const rows = conn
    .prepare(
      `SELECT substr(createdAt, 1, 10) AS day, kind, COUNT(*) AS c
       FROM events WHERE ${scope} AND createdAt >= @since
       GROUP BY day, kind ORDER BY day`,
    )
    .all({ practiceId, since }) as { day: string; kind: CapturedKind; c: number }[];

  const byDay = new Map<string, { appointment: number; message: number; callback: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    byDay.set(day, { appointment: 0, message: 0, callback: 0 });
  }
  for (const r of rows) {
    const bucket = byDay.get(r.day);
    if (bucket) bucket[r.kind] += r.c;
  }
  return Array.from(byDay, ([day, kinds]) => ({ day, ...kinds }));
}

/** Intent frequency for the last `days` days — feeds the "why people call" chart. */
export function intentBreakdown(practiceId: string | null, days: number) {
  const conn = db();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const scope = practiceId ? `practiceId = @practiceId` : `practiceId IS NULL`;
  return db()
    .prepare(
      `SELECT intent, COUNT(*) AS count FROM events
       WHERE ${scope} AND createdAt >= @since
       GROUP BY intent ORDER BY count DESC LIMIT 8`,
    )
    .all({ practiceId, since }) as { intent: string; count: number }[];
}

// Seed a few demo rows so the public dashboard isn't empty on first run.
function seedDemoIfEmpty(conn: Database.Database) {
  const count = (
    conn.prepare(`SELECT COUNT(*) AS c FROM events WHERE practiceId IS NULL`).get() as { c: number }
  ).c;
  if (count > 0) return;

  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  const seeds: {
    kind: CapturedKind;
    vertical: VerticalId;
    createdAt: string;
    name: string;
    contact: string;
    summary: string;
    details: Record<string, string>;
  }[] = [
    {
      kind: "appointment" as const,
      vertical: "dental" as const,
      createdAt: at(12),
      name: "Marcus Whitfield",
      contact: "(512) 555-0173",
      summary: "Booked routine cleaning",
      details: {
        service: "Routine cleaning",
        when: "Thursday at 10:30am",
        notes: "Existing patient, prefers morning",
      },
    },
    {
      kind: "message" as const,
      vertical: "dental" as const,
      createdAt: at(41),
      name: "Priya Nair",
      contact: "priya.nair@example.com",
      summary: "Toothache — possible emergency",
      details: {
        urgency: "High",
        notes: "Sharp pain lower-left molar since last night, wants same-day if possible",
      },
    },
    {
      kind: "callback" as const,
      vertical: "dental" as const,
      createdAt: at(96),
      name: "Dale Owens",
      contact: "(512) 555-0142",
      summary: "Insurance verification question",
      details: {
        notes: "Wants to confirm Delta Dental PPO is in-network before booking a crown",
      },
    },
  ];

  for (const s of seeds.reverse()) {
    addEvent(s);
  }
}
