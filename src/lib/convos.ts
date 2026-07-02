import { getDb, newId } from "./db";
import type { ChatMessage, Conversation, Lead } from "./types";

// Conversations + leads: everything the bots capture, scoped by workspace.

const TRANSCRIPT_KEEP = 40; // messages kept per conversation row

type ConvoRow = Omit<Conversation, "transcript"> & { transcript: string };

function toConversation(r: ConvoRow): Conversation {
  let transcript: ChatMessage[] = [];
  try {
    const v = JSON.parse(r.transcript);
    if (Array.isArray(v)) transcript = v;
  } catch {}
  return { ...r, transcript };
}

/** Upsert the conversation for this visitor+bot with the latest transcript. */
export function logConversation(input: {
  botId: string;
  workspaceId: string;
  visitorId: string;
  transcript: ChatMessage[];
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare(`SELECT id, messageCount FROM conversations WHERE botId = ? AND visitorId = ?`)
    .get(input.botId, input.visitorId) as { id: string; messageCount: number } | undefined;

  const transcript = JSON.stringify(input.transcript.slice(-TRANSCRIPT_KEEP));
  if (existing) {
    db.prepare(
      `UPDATE conversations SET transcript = ?, messageCount = messageCount + 1, lastMessageAt = ? WHERE id = ?`,
    ).run(transcript, now, existing.id);
  } else {
    db.prepare(
      `INSERT INTO conversations (id, botId, workspaceId, visitorId, transcript, messageCount, startedAt, lastMessageAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(newId("cnv"), input.botId, input.workspaceId, input.visitorId, transcript, now, now);
  }
}

export function listConversations(workspaceId: string, limit = 50): Conversation[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM conversations WHERE workspaceId = ? ORDER BY lastMessageAt DESC LIMIT ?`,
    )
    .all(workspaceId, limit) as ConvoRow[];
  return rows.map(toConversation);
}

// --- Leads ---------------------------------------------------------------------

export function addLead(input: {
  botId: string;
  workspaceId: string;
  name: string;
  email: string;
  message: string;
  source: string;
  createdAt?: string;
}): Lead {
  const lead: Lead = {
    id: newId("lead"),
    botId: input.botId,
    workspaceId: input.workspaceId,
    name: input.name || "Website visitor",
    email: input.email.trim().toLowerCase(),
    message: input.message,
    source: input.source,
    status: "new",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO leads (id, botId, workspaceId, name, email, message, source, status, createdAt)
       VALUES (@id, @botId, @workspaceId, @name, @email, @message, @source, @status, @createdAt)`,
    )
    .run(lead);
  return lead;
}

export function listLeads(workspaceId: string): Lead[] {
  return getDb()
    .prepare(`SELECT * FROM leads WHERE workspaceId = ? ORDER BY createdAt DESC`)
    .all(workspaceId) as Lead[];
}

export function getLead(id: string, workspaceId: string): Lead | null {
  const row = getDb()
    .prepare(`SELECT * FROM leads WHERE id = ? AND workspaceId = ?`)
    .get(id, workspaceId) as Lead | undefined;
  return row ?? null;
}

export function markLeadContacted(id: string, workspaceId: string): Lead | null {
  const info = getDb()
    .prepare(`UPDATE leads SET status = 'contacted' WHERE id = ? AND workspaceId = ?`)
    .run(id, workspaceId);
  if (info.changes === 0) return null;
  return getLead(id, workspaceId);
}

// --- Analytics -------------------------------------------------------------------

export function workspaceStats(workspaceId: string) {
  const db = getDb();
  const one = (sql: string) =>
    Number((db.prepare(sql).get(workspaceId) as { c: number }).c);
  return {
    conversations: one(`SELECT COUNT(*) AS c FROM conversations WHERE workspaceId = ?`),
    messages: one(
      `SELECT COALESCE(SUM(messageCount), 0) AS c FROM conversations WHERE workspaceId = ?`,
    ),
    leads: one(`SELECT COUNT(*) AS c FROM leads WHERE workspaceId = ?`),
    newLeads: one(`SELECT COUNT(*) AS c FROM leads WHERE workspaceId = ? AND status = 'new'`),
  };
}

/** Conversations + leads per day for the charts. */
export function dailySeries(workspaceId: string, days: number) {
  const db = getDb();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const convos = db
    .prepare(
      `SELECT substr(startedAt, 1, 10) AS day, COUNT(*) AS c FROM conversations
       WHERE workspaceId = ? AND startedAt >= ? GROUP BY day`,
    )
    .all(workspaceId, since) as { day: string; c: number }[];
  const leads = db
    .prepare(
      `SELECT substr(createdAt, 1, 10) AS day, COUNT(*) AS c FROM leads
       WHERE workspaceId = ? AND createdAt >= ? GROUP BY day`,
    )
    .all(workspaceId, since) as { day: string; c: number }[];

  const byDay = new Map<string, { conversations: number; leads: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    byDay.set(day, { conversations: 0, leads: 0 });
  }
  for (const r of convos) {
    const b = byDay.get(r.day);
    if (b) b.conversations = r.c;
  }
  for (const r of leads) {
    const b = byDay.get(r.day);
    if (b) b.leads = r.c;
  }
  return Array.from(byDay, ([day, v]) => ({ day, ...v }));
}
