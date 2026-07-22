import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Los Los Fest — administração",
};

export default function OggiFestAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
