import { getDb, newId } from "./db";
import { addEvent } from "./store";
import { getVertical } from "./verticals";
import type { Practice, Vertical, VerticalId } from "./types";

// Practice = the tenant. Each account configures its own receptionist —
// name, hours, services, FAQs, greeting — seeded from the vertical template.

type Row = Omit<Practice, "services" | "faq"> & { services: string; faq: string };

function toPractice(r: Row): Practice {
  return {
    ...r,
    services: safeParse(r.services, [] as string[]),
    faq: safeParse(r.faq, [] as { q: string; a: string }[]),
  };
}

function safeParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

const TRIAL_DAYS = 14;

export function createPractice(userId: string, name: string, verticalId: VerticalId): Practice {
  const template = getVertical(verticalId);
  const practiceName = name.trim() || template.practice;
  const practice: Practice = {
    id: newId("prc"),
    userId,
    name: practiceName,
    vertical: template.id,
    hours: template.hours,
    services: template.services,
    faq: template.faq,
    greeting: `Thanks for calling ${practiceName}, this is Robin. How can I help you today?`,
    plan: "trial",
    trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO practices (id, userId, name, vertical, hours, services, faq, greeting, plan, trialEndsAt, createdAt)
       VALUES (@id, @userId, @name, @vertical, @hours, @services, @faq, @greeting, @plan, @trialEndsAt, @createdAt)`,
    )
    .run({ ...practice, services: JSON.stringify(practice.services), faq: JSON.stringify(practice.faq) });
  seedSampleActivity(practice);
  return practice;
}

export function getPracticeByUser(userId: string): Practice | null {
  const row = getDb().prepare(`SELECT * FROM practices WHERE userId = ?`).get(userId) as
    | Row
    | undefined;
  return row ? toPractice(row) : null;
}

export function getPractice(id: string): Practice | null {
  const row = getDb().prepare(`SELECT * FROM practices WHERE id = ?`).get(id) as Row | undefined;
  return row ? toPractice(row) : null;
}

export function updatePractice(
  id: string,
  patch: Partial<Pick<Practice, "name" | "vertical" | "hours" | "services" | "faq" | "greeting">>,
): Practice | null {
  const current = getPractice(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  getDb()
    .prepare(
      `UPDATE practices SET name = @name, vertical = @vertical, hours = @hours,
       services = @services, faq = @faq, greeting = @greeting WHERE id = @id`,
    )
    .run({
      id,
      name: next.name,
      vertical: next.vertical,
      hours: next.hours,
      services: JSON.stringify(next.services),
      faq: JSON.stringify(next.faq),
      greeting: next.greeting,
    });
  return getPractice(id);
}

export function setPlan(id: string, plan: Practice["plan"]) {
  getDb().prepare(`UPDATE practices SET plan = ? WHERE id = ?`).run(plan, id);
}

/** The receptionist brain consumes a Vertical — build one from tenant config. */
export function practiceToVertical(p: Practice): Vertical {
  const template = getVertical(p.vertical);
  return {
    id: p.vertical,
    practice: p.name,
    label: template.label,
    tagline: template.tagline,
    services: p.services.length ? p.services : template.services,
    hours: p.hours,
    faq: p.faq.length ? p.faq : template.faq,
    greeting: p.greeting,
    emoji: template.emoji,
  };
}

// Seed a week of plausible activity for a new practice so the dashboard,
// charts, and AI briefing are alive from the first login.
function seedSampleActivity(p: Practice) {
  const names = [
    ["Jordan Ellis", "(512) 555-0119"],
    ["Sam Okafor", "(512) 555-0187"],
    ["Renee Castillo", "renee.c@example.com"],
    ["Theo Lindqvist", "(512) 555-0164"],
    ["Amara Diallo", "(512) 555-0102"],
    ["Beth Nguyen", "beth.n@example.com"],
    ["Luis Herrera", "(512) 555-0155"],
    ["Ivy Chen", "(512) 555-0133"],
    ["Omar Haddad", "omar.h@example.com"],
    ["Grace Kim", "(512) 555-0148"],
  ];
  const template = getVertical(p.vertical);
  const services = p.services.length ? p.services : template.services;
  const messages = [
    "Question about insurance coverage",
    "Requesting a prescription refill",
    "Billing question about last visit",
    "Severe pain since this morning — wants same-day",
    "Asking whether you're taking new patients",
  ];

  let n = 0;
  const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  for (let day = 6; day >= 0; day--) {
    const perDay = day === 0 ? 2 : 1 + ((day * 7 + 3) % 3);
    for (let i = 0; i < perDay; i++) {
      const [name, contact] = names[n % names.length];
      const hoursAgo = day * 24 + 2 + i * 3;
      const kindPick = (n + day) % 5;
      n++;
      if (kindPick < 3) {
        const service = services[n % services.length];
        addEvent({
          kind: "appointment",
          vertical: p.vertical,
          practiceId: p.id,
          name,
          contact,
          summary: `Booked ${service}`,
          details: { service, when: "next available", notes: "Captured by Robin" },
          createdAt: at(hoursAgo),
        });
      } else if (kindPick === 3) {
        const message = messages[n % messages.length];
        addEvent({
          kind: "message",
          vertical: p.vertical,
          practiceId: p.id,
          name,
          contact,
          summary: message,
          details: { notes: message },
          createdAt: at(hoursAgo),
        });
      } else {
        addEvent({
          kind: "callback",
          vertical: p.vertical,
          practiceId: p.id,
          name,
          contact,
          summary: "Wants a callback from the front desk",
          details: { notes: "Prefers afternoon" },
          createdAt: at(hoursAgo),
        });
      }
    }
  }
}
