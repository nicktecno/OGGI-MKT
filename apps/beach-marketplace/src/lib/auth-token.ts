import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./auth-types";
import { isRole } from "./auth-types";

export const SESSION_COOKIE = "ag_session";

export type AccountStatus = "PENDING_ADMIN_REVIEW" | "ACTIVE" | "REJECTED";

function getSecretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }
  if (process.env.NODE_ENV === "development") {
    return new TextEncoder().encode(
      "dev-only-agregador-auth-secret-32chars!",
    );
  }
  throw new Error(
    "Chave de autenticação do servidor ausente ou muito curta (mínimo 32 caracteres).",
  );
}

export type SessionPayload = {
  email: string;
  role: Role;
  /** Nome amigável */
  name?: string;
  /** Id da conta na API */
  sub?: string;
  /** Estado do cadastro na moderação */
  accountStatus?: AccountStatus;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const body: Record<string, unknown> = {
    email: payload.email,
    role: payload.role,
  };
  if (payload.name) body.name = payload.name;
  if (payload.accountStatus) body.accountStatus = payload.accountStatus;
  const jwt = new SignJWT(body)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d");
  if (payload.sub) {
    jwt.setSubject(payload.sub);
  }
  return jwt.sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = payload.role;
    if (!email || !isRole(role)) return null;
    const name = typeof payload.name === "string" ? payload.name : undefined;
    const sub = typeof payload.sub === "string" ? payload.sub : undefined;
    const rawStatus = payload.accountStatus;
    const accountStatus =
      rawStatus === "PENDING_ADMIN_REVIEW" || rawStatus === "ACTIVE" || rawStatus === "REJECTED"
        ? rawStatus
        : undefined;
    return { email, role, name, sub, accountStatus };
  } catch {
    return null;
  }
}
