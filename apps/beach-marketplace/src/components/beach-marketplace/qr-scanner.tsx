"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_BEACHES } from "@/lib/beach-marketplace/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, MapPin } from "lucide-react";

interface QRScannerProps {
  onBeachSelected?: (beachId: string) => void;
}

export function QRScanner({ onBeachSelected }: QRScannerProps) {
  const [selectedBeach, setSelectedBeach] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const handleBeachSelect = (beachId: string) => {
    setSelectedBeach(beachId);
    onBeachSelected?.(beachId);
  };

  const handleManualSubmit = () => {
    const beach = MOCK_BEACHES.find((b) => b.id === manualInput);
    if (beach) {
      handleBeachSelect(beach.id);
    }
  };

  if (selectedBeach) {
    const beach = MOCK_BEACHES.find((b) => b.id === selectedBeach);
    if (beach) {
      return (
        <div className="text-center space-y-4">
          <div className="text-green-600 text-sm font-semibold">✓ Praia selecionada</div>
          <h2 className="text-2xl font-bold">{beach.name}</h2>
          <p className="text-muted-foreground text-sm">{beach.description}</p>
          <Link href={`/praia/${beach.id}/pedido`}>
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700 w-full">
              Continuar para Catálogo
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBeach(null);
              setManualInput("");
            }}
          >
            Trocar Praia
          </Button>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Entrada Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Leia o código QR
          </CardTitle>
          <CardDescription>
            Escanei o código QR da praia ou escolha uma abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Código QR ou ID da praia..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          />
          <Button onClick={handleManualSubmit} className="w-full" variant="outline">
            Buscar
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Praias Disponíveis */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground">Praias Disponíveis</h3>
        {MOCK_BEACHES.map((beach) => (
          <Card
            key={beach.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleBeachSelect(beach.id)}
          >
            <CardContent className="pt-4 flex items-start justify-between">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-pink-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold">{beach.name}</h4>
                  <p className="text-sm text-muted-foreground">{beach.description}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost">
                →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
