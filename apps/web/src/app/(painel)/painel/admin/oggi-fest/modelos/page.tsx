import type { Metadata } from "next";
import { LoslosFestModelosAdminPage } from "@/components/loslos-fest/loslos-fest-admin-client";

export const metadata: Metadata = {
  title: "Modelos",
  description: "Modelos de festa Los Los Fest.",
};

export default function LoslosFestModelosPage() {
  return <LoslosFestModelosAdminPage />;
}
