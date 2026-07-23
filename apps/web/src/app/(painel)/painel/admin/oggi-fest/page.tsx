import type { Metadata } from "next";
import { LoslosFestAdminOverview } from "@/components/loslos-fest/loslos-fest-admin-shell";

export const metadata: Metadata = {
  title: "Los Los Fest — visão geral",
  description: "Painel administrador Los Los Fest (mock).",
};

export default function LoslosFestAdminOverviewPage() {
  return <LoslosFestAdminOverview />;
}
