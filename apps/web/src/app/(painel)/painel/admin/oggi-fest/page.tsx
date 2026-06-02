import type { Metadata } from "next";
import { OggiFestAdminOverview } from "@/components/oggi-fest/oggi-fest-admin-shell";

export const metadata: Metadata = {
  title: "Oggi Fest — visão geral",
  description: "Painel administrador Oggi Fest (mock).",
};

export default function OggiFestAdminOverviewPage() {
  return <OggiFestAdminOverview />;
}
