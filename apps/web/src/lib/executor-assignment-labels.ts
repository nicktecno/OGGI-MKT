import type { DemoProductionAssignment } from "./demo-seed";

export function executorAssignmentStatusLabel(
  status: DemoProductionAssignment["status"],
): string {
  switch (status) {
    case "ASSIGNED":
      return "Combinada — ainda não na loja";
    case "IN_PRODUCTION":
      return "Em produção";
    case "PRODUCTION_DONE":
      return "Produção concluída — falta liberar na loja";
    case "PUBLISHED":
      return "À venda na vitrine";
    case "ARCHIVED":
      return "Encerrada";
    default:
      return status;
  }
}
