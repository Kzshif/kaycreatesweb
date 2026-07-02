import { getDb, newId } from "./db";
import type { PlanId, Workspace } from "./types";

// Workspace = the tenant: one business / website.

const TRIAL_DAYS = 14;

export function createWorkspace(userId: string, name: string, website: string): Workspace {
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
  getDb()
    .prepare(
      `INSERT INTO workspaces (id, userId, name, website, about, plan, trialEndsAt, createdAt)
       VALUES (@id, @userId, @name, @website, @about, @plan, @trialEndsAt, @createdAt)`,
    )
    .run(workspace);
  return workspace;
}

export function getWorkspaceByUser(userId: string): Workspace | null {
  const row = getDb().prepare(`SELECT * FROM workspaces WHERE userId = ?`).get(userId) as
    | Workspace
    | undefined;
  return row ?? null;
}

export function getWorkspace(id: string): Workspace | null {
  const row = getDb().prepare(`SELECT * FROM workspaces WHERE id = ?`).get(id) as
    | Workspace
    | undefined;
  return row ?? null;
}

export function updateWorkspace(
  id: string,
  patch: Partial<Pick<Workspace, "name" | "website" | "about">>,
): Workspace | null {
  const current = getWorkspace(id);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    website: patch.website !== undefined ? normalizeUrl(patch.website) : current.website,
  };
  getDb()
    .prepare(`UPDATE workspaces SET name = @name, website = @website, about = @about WHERE id = @id`)
    .run({ id, name: next.name, website: next.website, about: next.about });
  return getWorkspace(id);
}

export function setPlan(id: string, plan: PlanId) {
  getDb().prepare(`UPDATE workspaces SET plan = ? WHERE id = ?`).run(plan, id);
}

function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
