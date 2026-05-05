"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUploadField } from "@/components/upload/image-upload-field";

/** Bloco de demonstração do pipeline de upload (compressão no navegador). */
export function FornecedorImageUploadDemo() {
  return (
    <Card className="max-w-4xl border-border">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Foto do insumo</CardTitle>
        <CardDescription>
          Compressão automática no navegador (WebP ou JPEG) até 1 MB antes de qualquer envio à API / Cloudflare R2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUploadField label="Enviar imagem" />
      </CardContent>
    </Card>
  );
}
