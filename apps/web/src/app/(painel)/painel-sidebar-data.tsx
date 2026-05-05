import type { Role } from "@/lib/auth-types";
import { getDemoCommerceState } from "@/lib/demo-runtime";
import { fetchPendingRegistrationsCount } from "@/lib/platform-internal";
import { PainelSidebar, type AdminNavCounts } from "./painel-sidebar";

export async function PainelSidebarWithNavCounts({
  role,
  painelHome,
}: {
  role: Role;
  painelHome: string;
}) {
  let adminNavCounts: AdminNavCounts | undefined;
  if (role === "ADMIN") {
    try {
      const state = await getDemoCommerceState();
      const pendingRegistrationsCount = await fetchPendingRegistrationsCount();
      adminNavCounts = {
        pendingRegistrationsCount,
        pendingRequestsCount: state.executionRequests.filter((r) => r.status === "PENDING").length,
        activeCombinationsCount: state.productionAssignments.filter((a) => a.status !== "ARCHIVED")
          .length,
      };
    } catch (e) {
      console.error("[PainelSidebarWithNavCounts] estado da loja ou contagem de cadastros:", e);
      adminNavCounts = {
        pendingRegistrationsCount: 0,
        pendingRequestsCount: 0,
        activeCombinationsCount: 0,
      };
    }
  }
  return <PainelSidebar role={role} painelHome={painelHome} adminNavCounts={adminNavCounts} />;
}
