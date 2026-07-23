import type { Metadata } from "next";
import { QRScanner } from "@/components/beach-marketplace/qr-scanner";

export const metadata: Metadata = {
  title: "Marketplace de Praia — Los Los",
  description: "Peça sorvetes direto na praia e receba de um ambulante próximo.",
};

export default function PraiaPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-pink-600">🏖️ Los Los na Praia</h1>
          <p className="text-muted-foreground">
            Peça sorvetes direto da praia. Escanei o QR code ou escolha uma praia abaixo.
          </p>
        </div>

        <QRScanner />
      </div>
    </main>
  );
}
