import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth-token";
import type { SessionPayload } from "./auth-token";

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
