import type { Metadata } from "next";
import { OggiFestLinhasAdminPage } from "@/components/oggi-fest/oggi-fest-admin-client";

export const metadata: Metadata = {
  title: "Linhas de sorvete",
  description: "Cadastro de linhas Los Los Fest.",
};

export default function OggiFestLinhasPage() {
  return <OggiFestLinhasAdminPage />;
}
