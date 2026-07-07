import type { NextRequest } from "next/server";
import { getUserFromRequest } from "./auth";
import { getWorkspaceByUser } from "./workspaces";
import type { User, Workspace } from "./types";

/** Resolves the authenticated user + their workspace for API routes. */
export async function tenantFromRequest(
  req: NextRequest,
): Promise<{ user: User; workspace: Workspace } | null> {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const workspace = await getWorkspaceByUser(user.id);
  if (!workspace) return null;
  return { user, workspace };
}
