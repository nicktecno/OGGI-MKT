export const ROLES = ["ADMIN", "SUPPLIER", "EXECUTOR", "CUSTOMER"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/painel/admin/pecas";
    case "SUPPLIER":
      return "/painel/fornecedor";
    case "EXECUTOR":
      return "/painel/executor";
    case "CUSTOMER":
      return "/painel/cliente";
    default:
      return "/";
  }
}

export function roleForPainelSegment(segment: string): Role | null {
  switch (segment) {
    case "admin":
      return "ADMIN";
    case "fornecedor":
      return "SUPPLIER";
    case "executor":
      return "EXECUTOR";
    case "cliente":
      return "CUSTOMER";
    default:
      return null;
  }
}
