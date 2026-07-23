import type { Metadata } from "next";
import { LoslosFestLinhasAdminPage } from "@/components/loslos-fest/loslos-fest-admin-client";

export const metadata: Metadata = {
  title: "Linhas de sorvete",
  description: "Cadastro de linhas Los Los Fest.",
};

export default function LoslosFestLinhasPage() {
  return <LoslosFestLinhasAdminPage />;
}
