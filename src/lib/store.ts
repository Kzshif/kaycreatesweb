import type { CapturedEvent, CapturedKind, VerticalId } from "./types";

// In-memory event store. This is a demo: everything the receptionist captures
// (appointments, messages, callbacks) lands here so the dashboard can show it.
// In production this would be a database + your scheduling system / EHR.
//
// We stash it on globalThis so the data survives Next.js hot-reloads and is
// shared across route handlers within the same server process.
type StoreShape = { events: CapturedEvent[]; seq: number };

const g = globalThis as unknown as { __frontdesk?: StoreShape };

function store(): StoreShape {
  if (!g.__frontdesk) {
    g.__frontdesk = { events: seed(), seq: 1000 };
  }
  return g.__frontdesk;
}

function id(): string {
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
}): CapturedEvent {
  const evt: CapturedEvent = {
    id: id(),
    kind: input.kind,
    vertical: input.vertical,
    createdAt: new Date().toISOString(),
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

// A little seed data so the dashboard isn't empty on first load.
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
      contact: "(512) 555-0173",
      summary: "Booked routine cleaning",
      details: {
        service: "Routine cleaning",
        when: "Thursday at 10:30am",
        notes: "Existing patient, prefers morning",
      },
      status: "new",
    },
    {
      id: "evt_1002",
      kind: "message",
      vertical: "dental",
      createdAt: at(41),
      name: "Priya Nair",
      contact: "priya.nair@example.com",
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
      contact: "(512) 555-0142",
      summary: "Insurance verification question",
      details: {
        notes: "Wants to confirm Delta Dental PPO is in-network before booking a crown",
      },
      status: "actioned",
    },
  ];
}
