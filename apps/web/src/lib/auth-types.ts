export const ROLES = ["ADMIN", "SUPPLIER", "EXECUTOR", "CUSTOMER"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/painel/admin/oggi-fest";
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

/** Rótulo amigável do papel (UI do painel e cadastro). */
export function roleDisplayLabel(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "SUPPLIER":
      return "Fornecedor";
    case "EXECUTOR":
      return "Costureira";
    case "CUSTOMER":
      return "Cliente";
    default:
      return role;
  }
}

/** Uma linha sobre o que o perfil faz no sistema. */
export function roleDisplayHint(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Los Los Fest — linhas, modelos e filiais";
    case "SUPPLIER":
      return "Insumos e entregas às costureiras";
    case "EXECUTOR":
      return "Produção, vitrine e envios ao cliente";
    case "CUSTOMER":
      return "Compras na loja";
    default:
      return "";
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
