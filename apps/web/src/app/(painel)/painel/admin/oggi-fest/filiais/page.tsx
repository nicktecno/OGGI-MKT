import type { Metadata } from "next";
import { LoslosFestFiliaisAdminPage } from "@/components/loslos-fest/loslos-fest-admin-client";

export const metadata: Metadata = {
  title: "Filiais",
  description: "Filiais para retirada do carrinho Los Los Fest.",
};

export default function LoslosFestFiliaisPage() {
  return <LoslosFestFiliaisAdminPage />;
}
