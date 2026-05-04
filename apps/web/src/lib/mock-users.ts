import type { Role } from "./auth-types";

/** Credenciais só para MVP / desenvolvimento — substituir por Nest + OAuth. */
export const MOCK_USERS: Record<
  string,
  { password: string; role: Role; label: string; displayName: string }
> = {
  "admin@demo.local": {
    password: "Demo#2026",
    role: "ADMIN",
    label: "Administrador",
    displayName: "Ana Runway",
  },
  "fornecedor@demo.local": {
    password: "Demo#2026",
    role: "SUPPLIER",
    label: "Fornecedor",
    displayName: "Bruno Tecidos",
  },
  "executor@demo.local": {
    password: "Demo#2026",
    role: "EXECUTOR",
    label: "Executor",
    displayName: "Carla Mendes",
  },
  "cliente@demo.local": {
    password: "Demo#2026",
    role: "CUSTOMER",
    label: "Cliente",
    displayName: "Dana Oliveira",
  },
};

export function authenticateMockUser(
  email: string,
  password: string,
): { email: string; role: Role; name: string } | null {
  const key = email.trim().toLowerCase();
  const row = MOCK_USERS[key];
  if (!row || row.password !== password) return null;
  return { email: key, role: row.role, name: row.displayName };
}
