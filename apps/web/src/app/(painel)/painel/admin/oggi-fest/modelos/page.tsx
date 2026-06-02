import type { Metadata } from "next";
import { OggiFestModelosAdminPage } from "@/components/oggi-fest/oggi-fest-admin-client";

export const metadata: Metadata = {
  title: "Modelos",
  description: "Modelos de festa Oggi Fest.",
};

export default function OggiFestModelosPage() {
  return <OggiFestModelosAdminPage />;
}
