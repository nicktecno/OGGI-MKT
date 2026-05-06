import type { Metadata } from "next";
import { commerceUsesDatabase } from "@/lib/demo-runtime";
import { fetchSupplyCatalogFromApi } from "@/lib/supply-catalog";
import { CadastroPecaSectionClient } from "../admin-section-clients";

export const metadata: Metadata = {
  title: "Cadastro de peça",
};

export default async function AdminCadastroPecaPage() {
  const supplyCatalogExtra = await fetchSupplyCatalogFromApi();
  const marketplaceImagesEnabled = commerceUsesDatabase();
  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Cadastro de peça
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Monte o modelo com <strong className="text-foreground">insumos dos fornecedores</strong>, dados de vitrine
          (nome, SKU, tamanhos, fotos) e quantidades por linha.{" "}
          <strong className="text-foreground">Não há preços aqui</strong> — custos unitários, taxas e pacote ao cliente
          ficam em <strong className="text-foreground">Peças e preços</strong>. A prévia na loja só passa a incluir o
          frete B2B dos insumos após vincular costureira (preço definitivo).
        </p>
      </header>
      <CadastroPecaSectionClient
        supplyCatalogExtra={supplyCatalogExtra}
        marketplaceImagesEnabled={marketplaceImagesEnabled}
      />
    </div>
  );
}
