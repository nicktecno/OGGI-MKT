import type { Metadata } from "next";
import { OggiFestFiliaisAdminPage } from "@/components/oggi-fest/oggi-fest-admin-client";

export const metadata: Metadata = {
  title: "Filiais",
  description: "Filiais para retirada do carrinho Oggi Fest.",
};

export default function OggiFestFiliaisPage() {
  return <OggiFestFiliaisAdminPage />;
}
