import "server-only";
import { NextResponse } from "next/server";
import { getSessionUser } from "./session";

/**
 * Guard for API route handlers. Usage:
 *   const { user, response } = await requireAuth();
 *   if (!user) return response;
 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}
