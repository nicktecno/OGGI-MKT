"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { MOCK_BEACHES } from "@/lib/beach-marketplace/mock-data";
import type { Beach } from "@/lib/beach-marketplace/types";

export default function BeachQRPage() {
  const params = useParams<{ beachId: string }>();
  const [beach, setBeach] = useState<Beach | null | undefined>(undefined);
  const [origin, setOrigin] = useState("http://localhost:3002");

  useEffect(() => {
    setOrigin(window.location.origin);
    const found = MOCK_BEACHES.find((b) => b.id === params.beachId);
    setBeach(found ?? null);
  }, [params.beachId]);

  if (beach === null) notFound();
  if (beach === undefined) return null;

  const beachUrl = `${origin}/praia/${beach.id}`;

  // URL para gerar QR via API pública (não requer dependência extra)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(beachUrl)}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        {/* Cabeçalho imprimível */}
        <div className="mb-6">
          <div className="text-4xl mb-2">🏖️</div>
          <h1 className="text-2xl font-black text-primary">{beach.name}</h1>
          <p className="text-muted-foreground text-sm">Los Los na Praia</p>
        </div>

        {/* QR Code */}
        <div className="border-4 border-primary rounded-2xl p-4 inline-block mb-6 bg-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrApiUrl}
            alt={`QR Code para ${beach.name}`}
            width={300}
            height={300}
            className="rounded-lg"
          />
        </div>

        {/* Instrução */}
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-6">
          <p className="text-foreground font-bold text-base mb-1">📱 Aponte a câmera aqui</p>
          <p className="text-muted-foreground text-sm">
            Peça seu sorvete Los Los sem sair da areia!
          </p>
          <p className="text-primary/70 text-xs mt-2 break-all">{beachUrl}</p>
        </div>

        {/* Botões (não aparecem na impressão) */}
        <div className="flex gap-3 justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition"
          >
            🖨️ Imprimir
          </button>
          <a
            href={qrApiUrl}
            download={`qr-${beach.id}.png`}
            className="bg-secondary text-secondary-foreground font-bold px-6 py-2.5 rounded-xl hover:bg-secondary/80 transition"
          >
            ⬇️ Baixar PNG
          </a>
          <a
            href="/admin/praias"
            className="bg-card text-muted-foreground font-bold px-6 py-2.5 rounded-xl hover:bg-secondary transition border border-border"
          >
            ← Voltar
          </a>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; background: #fff !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
