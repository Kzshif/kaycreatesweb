import type { CapturedEvent, CapturedKind, VerticalId } from "./types";

// In-memory capture store. Everything the receptionist records (appointments,
// messages, callbacks) lives here so the dashboard can show it. It's memoised on
// globalThis so it survives hot-reloads and is shared across route handlers in a
// single server instance.
//
// This is intentionally dependency-free so it runs on any host (Netlify, Vercel,
// Node). On serverless it persists within a warm instance; for durable storage
// across instances, swap this module for a hosted database / your PMS or EHR.
type StoreShape = { events: CapturedEvent[]; seq: number };

const g = globalThis as unknown as { __frontdesk?: StoreShape };

function store(): StoreShape {
  if (!g.__frontdesk) {
    g.__frontdesk = { events: seed(), seq: 1000 };
  }
  return g.__frontdesk;
}

function nextId(): string {
  const s = store();
  s.seq += 1;
  return `evt_${s.seq}`;
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
  const evt: CapturedEvent = {
    id: nextId(),
    kind: input.kind,
    vertical: input.vertical,
    createdAt: input.createdAt ?? new Date().toISOString(),
    name: input.name || "Unknown caller",
    contact: input.contact || "—",
    summary: input.summary,
    details: input.details ?? {},
    status: "new",
  };
  store().events.unshift(evt);
  return evt;
}

export function listEvents(vertical?: VerticalId): CapturedEvent[] {
  const all = store().events;
  return vertical ? all.filter((e) => e.vertical === vertical) : all;
}

export function actionEvent(eventId: string): CapturedEvent | null {
  const evt = store().events.find((e) => e.id === eventId);
  if (!evt) return null;
  evt.status = "actioned";
  return evt;
}

export function stats() {
  const events = store().events;
  return {
    total: events.length,
    appointments: events.filter((e) => e.kind === "appointment").length,
    messages: events.filter((e) => e.kind === "message").length,
    callbacks: events.filter((e) => e.kind === "callback").length,
    unactioned: events.filter((e) => e.status === "new").length,
  };
}

// Seed a few rows so the dashboard isn't empty on first load (UK / Newbury).
function seed(): CapturedEvent[] {
  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  return [
    {
      id: "evt_1003",
      kind: "appointment",
      vertical: "dental",
      createdAt: at(12),
      name: "Marcus Whitfield",
      contact: "07700 900173",
      summary: "Booked check-up & scale and polish",
      details: {
        service: "Check-up & scale and polish",
        when: "Thursday at 10:30am",
        notes: "Existing patient, prefers mornings",
      },
      status: "new",
    },
    {
      id: "evt_1002",
      kind: "message",
      vertical: "dental",
      createdAt: at(41),
      name: "Priya Nair",
      contact: "priya.nair@example.co.uk",
      summary: "Toothache — possible emergency",
      details: {
        urgency: "High",
        notes: "Sharp pain lower-left molar since last night, wants same-day if possible",
      },
      status: "new",
    },
    {
      id: "evt_1001",
      kind: "callback",
      vertical: "dental",
      createdAt: at(96),
      name: "Dale Owens",
      contact: "01635 900142",
      summary: "Denplan membership question",
      details: {
        notes: "Wants to confirm Denplan covers a crown before booking",
      },
      status: "actioned",
    },
  ];
}
