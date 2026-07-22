import type { Metadata } from "next";
import { OggiFestAdminOverview } from "@/components/oggi-fest/oggi-fest-admin-shell";

export const metadata: Metadata = {
  title: "Los Los Fest — visão geral",
  description: "Painel administrador Los Los Fest (mock).",
};

export default function OggiFestAdminOverviewPage() {
  return <OggiFestAdminOverview />;
}
