import { newId, qOne, run } from "./db";
import type { PlanId, Workspace } from "./types";

// Workspace = the tenant: one business / website.

const TRIAL_DAYS = 14;

export async function createWorkspace(
  userId: string,
  name: string,
  website: string,
): Promise<Workspace> {
  const workspace: Workspace = {
    id: newId("ws"),
    userId,
    name: name.trim(),
    website: normalizeUrl(website),
    about: "",
    plan: "trial",
    trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  await run(
    `INSERT INTO workspaces (id, userId, name, website, about, plan, trialEndsAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      workspace.id,
      workspace.userId,
      workspace.name,
      workspace.website,
      workspace.about,
      workspace.plan,
      workspace.trialEndsAt,
      workspace.createdAt,
    ],
  );
  return workspace;
}

export async function getWorkspaceByUser(userId: string): Promise<Workspace | null> {
  return qOne<Workspace>(`SELECT * FROM workspaces WHERE userId = ?`, [userId]);
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  return qOne<Workspace>(`SELECT * FROM workspaces WHERE id = ?`, [id]);
}

export async function updateWorkspace(
  id: string,
  patch: Partial<Pick<Workspace, "name" | "website" | "about">>,
): Promise<Workspace | null> {
  const current = await getWorkspace(id);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    website: patch.website !== undefined ? normalizeUrl(patch.website) : current.website,
  };
  await run(`UPDATE workspaces SET name = ?, website = ?, about = ? WHERE id = ?`, [
    next.name,
    next.website,
    next.about,
    id,
  ]);
  return getWorkspace(id);
}

export async function setPlan(id: string, plan: PlanId) {
  await run(`UPDATE workspaces SET plan = ? WHERE id = ?`, [plan, id]);
}

function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
