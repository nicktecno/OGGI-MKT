import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { hideDemoCredentialsUi } from "@/lib/deployment-env";

/**
 * Login e sessão contra `mock-users` (sem Nest).
 * Padrão em desenvolvimento para o painel Oggi Fest mockado.
 * Em produção usa a API quando `commerceUsesDatabase()` estiver ativo.
 */
export function authUsesMockCredentials(): boolean {
  if (hideDemoCredentialsUi()) {
    return !commerceUsesDatabase();
  }

  const flag = process.env.MOCK_AUTH?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;

  return true;
}
