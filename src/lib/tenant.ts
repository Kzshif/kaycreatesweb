import type { NextRequest } from "next/server";
import { getUserFromRequest } from "./auth";
import { getPracticeByUser } from "./practices";
import type { Practice, User } from "./types";

/** Resolves the authenticated user + their practice for API routes. */
export function tenantFromRequest(req: NextRequest): { user: User; practice: Practice } | null {
  const user = getUserFromRequest(req);
  if (!user) return null;
  const practice = getPracticeByUser(user.id);
  if (!practice) return null;
  return { user, practice };
}
