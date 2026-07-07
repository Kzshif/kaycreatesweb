import { newId, q, qOne, run } from "./db";
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
export async function logConversation(input: {
  botId: string;
  workspaceId: string;
  visitorId: string;
  transcript: ChatMessage[];
}) {
  const now = new Date().toISOString();
  const existing = await qOne<{ id: string; messageCount: number }>(
    `SELECT id, messageCount FROM conversations WHERE botId = ? AND visitorId = ?`,
    [input.botId, input.visitorId],
  );

  const transcript = JSON.stringify(input.transcript.slice(-TRANSCRIPT_KEEP));
  if (existing) {
    await run(
      `UPDATE conversations SET transcript = ?, messageCount = messageCount + 1, lastMessageAt = ? WHERE id = ?`,
      [transcript, now, existing.id],
    );
  } else {
    await run(
      `INSERT INTO conversations (id, botId, workspaceId, visitorId, transcript, messageCount, startedAt, lastMessageAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [newId("cnv"), input.botId, input.workspaceId, input.visitorId, transcript, now, now],
    );
  }
}

export async function listConversations(workspaceId: string, limit = 50): Promise<Conversation[]> {
  const rows = await q<ConvoRow>(
    `SELECT * FROM conversations WHERE workspaceId = ? ORDER BY lastMessageAt DESC LIMIT ?`,
    [workspaceId, limit],
  );
  return rows.map(toConversation);
}

// --- Leads ---------------------------------------------------------------------

export async function addLead(input: {
  botId: string;
  workspaceId: string;
  name: string;
  email: string;
  message: string;
  source: string;
  createdAt?: string;
}): Promise<Lead> {
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
  await run(
    `INSERT INTO leads (id, botId, workspaceId, name, email, message, source, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead.id,
      lead.botId,
      lead.workspaceId,
      lead.name,
      lead.email,
      lead.message,
      lead.source,
      lead.status,
      lead.createdAt,
    ],
  );
  return lead;
}

export async function listLeads(workspaceId: string): Promise<Lead[]> {
  return q<Lead>(`SELECT * FROM leads WHERE workspaceId = ? ORDER BY createdAt DESC`, [
    workspaceId,
  ]);
}

export async function getLead(id: string, workspaceId: string): Promise<Lead | null> {
  return qOne<Lead>(`SELECT * FROM leads WHERE id = ? AND workspaceId = ?`, [id, workspaceId]);
}

export async function markLeadContacted(id: string, workspaceId: string): Promise<Lead | null> {
  const info = await run(`UPDATE leads SET status = 'contacted' WHERE id = ? AND workspaceId = ?`, [
    id,
    workspaceId,
  ]);
  if (info.changes === 0) return null;
  return getLead(id, workspaceId);
}

// --- Analytics -------------------------------------------------------------------

export async function workspaceStats(workspaceId: string) {
  const one = async (sql: string) => {
    const row = await qOne<{ c: number | string }>(sql, [workspaceId]);
    return Number(row?.c ?? 0);
  };
  return {
    conversations: await one(`SELECT COUNT(*) AS c FROM conversations WHERE workspaceId = ?`),
    messages: await one(
      `SELECT COALESCE(SUM(messageCount), 0) AS c FROM conversations WHERE workspaceId = ?`,
    ),
    leads: await one(`SELECT COUNT(*) AS c FROM leads WHERE workspaceId = ?`),
    newLeads: await one(`SELECT COUNT(*) AS c FROM leads WHERE workspaceId = ? AND status = 'new'`),
  };
}

/** Conversations + leads per day for the charts. */
export async function dailySeries(workspaceId: string, days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const convos = await q<{ day: string; c: number | string }>(
    `SELECT substr(startedAt, 1, 10) AS day, COUNT(*) AS c FROM conversations
     WHERE workspaceId = ? AND startedAt >= ? GROUP BY substr(startedAt, 1, 10)`,
    [workspaceId, since],
  );
  const leads = await q<{ day: string; c: number | string }>(
    `SELECT substr(createdAt, 1, 10) AS day, COUNT(*) AS c FROM leads
     WHERE workspaceId = ? AND createdAt >= ? GROUP BY substr(createdAt, 1, 10)`,
    [workspaceId, since],
  );

  const byDay = new Map<string, { conversations: number; leads: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    byDay.set(day, { conversations: 0, leads: 0 });
  }
  for (const r of convos) {
    const b = byDay.get(r.day);
    if (b) b.conversations = Number(r.c);
  }
  for (const r of leads) {
    const b = byDay.get(r.day);
    if (b) b.leads = Number(r.c);
  }
  return Array.from(byDay, ([day, v]) => ({ day, ...v }));
}
