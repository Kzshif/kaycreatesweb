import type { NextRequest } from "next/server";
import { getUserFromRequest } from "./auth";
import { getWorkspaceByUser } from "./workspaces";
import type { User, Workspace } from "./types";

/** Resolves the authenticated user + their workspace for API routes. */
export function tenantFromRequest(req: NextRequest): { user: User; workspace: Workspace } | null {
  const user = getUserFromRequest(req);
  if (!user) return null;
  const workspace = getWorkspaceByUser(user.id);
  if (!workspace) return null;
  return { user, workspace };
}
