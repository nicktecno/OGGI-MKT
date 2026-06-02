import type { Role } from "@/lib/auth-types";
import { PainelSidebar } from "./painel-sidebar";

export async function PainelSidebarWithNavCounts({
  role,
  painelHome,
}: {
  role: Role;
  painelHome: string;
}) {
  return <PainelSidebar role={role} painelHome={painelHome} />;
}
