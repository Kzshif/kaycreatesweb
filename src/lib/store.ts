import type { CapturedEvent, CapturedKind, VerticalId } from "./types";

// Capture store with two backends behind one async API:
//   • Postgres (Neon serverless, over HTTP) when a connection string is set —
//     durable across instances/restarts. No native modules, serverless-safe.
//   • In-memory otherwise — zero-config for local dev and demos.
//
// Set one of DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL / NETLIFY_DATABASE_URL
// (Vercel's Neon integration sets DATABASE_URL automatically) to turn on Postgres.

const DB_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  "";

type NewEvent = {
  kind: CapturedKind;
  vertical: VerticalId;
  name: string;
  contact: string;
  summary: string;
  details?: Record<string, string>;
  createdAt?: string;
};

function makeEvent(input: NewEvent, id: string): CapturedEvent {
  return {
    id,
    kind: input.kind,
    vertical: input.vertical,
    createdAt: input.createdAt ?? new Date().toISOString(),
    name: input.name || "Unknown caller",
    contact: input.contact || "—",
    summary: input.summary,
    details: input.details ?? {},
    status: "new",
  };
}

function newId(): string {
  return `evt_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

function seedEvents(): CapturedEvent[] {
  const now = Date.now();
  const at = (m: number) => new Date(now - m * 60_000).toISOString();
  return [
    makeEvent(
      {
        kind: "appointment",
        vertical: "dental",
        name: "Marcus Whitfield",
        contact: "07700 900173",
        summary: "Booked check-up & scale and polish",
        details: { service: "Check-up & scale and polish", when: "Thursday at 10:30am", notes: "Existing patient, prefers mornings" },
        createdAt: at(12),
      },
      "evt_seed3",
    ),
    makeEvent(
      {
        kind: "message",
        vertical: "dental",
        name: "Priya Nair",
        contact: "priya.nair@example.co.uk",
        summary: "Toothache — possible emergency",
        details: { urgency: "High", notes: "Sharp pain lower-left molar since last night, wants same-day if possible" },
        createdAt: at(41),
      },
      "evt_seed2",
    ),
    { ...makeEvent(
      {
        kind: "callback",
        vertical: "dental",
        name: "Dale Owens",
        contact: "01635 900142",
        summary: "Denplan membership question",
        details: { notes: "Wants to confirm Denplan covers a crown before booking" },
        createdAt: at(96),
      },
      "evt_seed1",
    ), status: "actioned" as const },
  ];
}

// ---------------------------------------------------------------------------
// In-memory backend
// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __frontdesk?: { events: CapturedEvent[] } };
function mem() {
  if (!g.__frontdesk) g.__frontdesk = { events: seedEvents() };
  return g.__frontdesk;
}

// ---------------------------------------------------------------------------
// Postgres (Neon) backend
// ---------------------------------------------------------------------------

type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;
const pg = globalThis as unknown as { __frontdeskSql?: Sql; __frontdeskInit?: Promise<void> };

async function getSql(): Promise<Sql | null> {
  if (!DB_URL) return null;
  if (!pg.__frontdeskSql) {
    const { neon } = await import("@neondatabase/serverless");
    pg.__frontdeskSql = neon(DB_URL) as unknown as Sql;
  }
  const sql = pg.__frontdeskSql!;
  if (!pg.__frontdeskInit) pg.__frontdeskInit = initSchema(sql);
  await pg.__frontdeskInit;
  return sql;
}

async function initSchema(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      seq        bigserial PRIMARY KEY,
      id         text UNIQUE NOT NULL,
      kind       text NOT NULL,
      vertical   text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      name       text NOT NULL,
      contact    text NOT NULL,
      summary    text NOT NULL,
      details    jsonb NOT NULL DEFAULT '{}',
      status     text NOT NULL DEFAULT 'new'
    )`;
  const rows = await sql`SELECT count(*)::int AS c FROM events`;
  if (Number(rows[0].c) === 0) {
    for (const e of [...seedEvents()].reverse()) {
      await sql`
        INSERT INTO events (id, kind, vertical, created_at, name, contact, summary, details, status)
        VALUES (${e.id}, ${e.kind}, ${e.vertical}, ${e.createdAt}, ${e.name}, ${e.contact}, ${e.summary}, ${JSON.stringify(e.details)}::jsonb, ${e.status})
        ON CONFLICT (id) DO NOTHING`;
    }
  }
}

function rowToEvent(r: Record<string, unknown>): CapturedEvent {
  const details = r.details;
  return {
    id: String(r.id),
    kind: r.kind as CapturedKind,
    vertical: r.vertical as VerticalId,
    createdAt: new Date(r.created_at as string).toISOString(),
    name: String(r.name),
    contact: String(r.contact),
    summary: String(r.summary),
    details: (typeof details === "object" && details ? details : {}) as Record<string, string>,
    status: r.status as "new" | "actioned",
  };
}

// ---------------------------------------------------------------------------
// Public async API (same shape as before, now Promise-returning)
// ---------------------------------------------------------------------------

export async function addEvent(input: NewEvent): Promise<CapturedEvent> {
  const evt = makeEvent(input, newId());
  const sql = await getSql();
  if (sql) {
    await sql`
      INSERT INTO events (id, kind, vertical, created_at, name, contact, summary, details, status)
      VALUES (${evt.id}, ${evt.kind}, ${evt.vertical}, ${evt.createdAt}, ${evt.name}, ${evt.contact}, ${evt.summary}, ${JSON.stringify(evt.details)}::jsonb, 'new')`;
    return evt;
  }
  mem().events.unshift(evt);
  return evt;
}

export async function listEvents(vertical?: VerticalId): Promise<CapturedEvent[]> {
  const sql = await getSql();
  if (sql) {
    const rows = vertical
      ? await sql`SELECT * FROM events WHERE vertical = ${vertical} ORDER BY seq DESC`
      : await sql`SELECT * FROM events ORDER BY seq DESC`;
    return rows.map(rowToEvent);
  }
  const all = mem().events;
  return vertical ? all.filter((e) => e.vertical === vertical) : all;
}

export async function actionEvent(eventId: string): Promise<CapturedEvent | null> {
  const sql = await getSql();
  if (sql) {
    const rows = await sql`UPDATE events SET status = 'actioned' WHERE id = ${eventId} RETURNING *`;
    return rows.length ? rowToEvent(rows[0]) : null;
  }
  const evt = mem().events.find((e) => e.id === eventId);
  if (!evt) return null;
  evt.status = "actioned";
  return evt;
}

export async function stats() {
  const sql = await getSql();
  if (sql) {
    const rows = await sql`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE kind = 'appointment')::int AS appointments,
        count(*) FILTER (WHERE kind = 'message')::int AS messages,
        count(*) FILTER (WHERE kind = 'callback')::int AS callbacks,
        count(*) FILTER (WHERE status = 'new')::int AS unactioned
      FROM events`;
    const r = rows[0];
    return {
      total: Number(r.total),
      appointments: Number(r.appointments),
      messages: Number(r.messages),
      callbacks: Number(r.callbacks),
      unactioned: Number(r.unactioned),
    };
  }
  const events = mem().events;
  return {
    total: events.length,
    appointments: events.filter((e) => e.kind === "appointment").length,
    messages: events.filter((e) => e.kind === "message").length,
    callbacks: events.filter((e) => e.kind === "callback").length,
    unactioned: events.filter((e) => e.status === "new").length,
  };
}

/** True when a persistent Postgres backend is configured. */
export function isPersistent(): boolean {
  return !!DB_URL;
}
