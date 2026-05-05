-- CreateEnum
CREATE TYPE "SupplyQuantityKind" AS ENUM ('METRO', 'PECA');

-- AlterTable
ALTER TABLE "SupplyItem" ADD COLUMN "imagem_url" TEXT,
ADD COLUMN "observacao" TEXT,
ADD COLUMN "quantidade_kind" "SupplyQuantityKind" NOT NULL DEFAULT 'METRO',
ADD COLUMN "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "SupplierFulfillmentLine" (
    "id" TEXT NOT NULL,
    "production_assignment_id" TEXT NOT NULL,
    "supply_item_id" TEXT NOT NULL,
    "supplier_account_id" TEXT NOT NULL,
    "composite_product_id" TEXT NOT NULL,
    "product_nome" TEXT NOT NULL,
    "quantidade_por_peca" DOUBLE PRECISION NOT NULL,
    "executor_nome" TEXT NOT NULL,
    "executor_email" TEXT NOT NULL,
    "executor_cep" TEXT NOT NULL,
    "executor_cidade" TEXT NOT NULL,
    "executor_endereco" TEXT NOT NULL,
    "melhor_envio_etiqueta_url" TEXT,
    "melhor_envio_pedido_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierFulfillmentLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupplierFulfillmentLine_supplier_account_id_idx" ON "SupplierFulfillmentLine"("supplier_account_id");

CREATE INDEX "SupplierFulfillmentLine_production_assignment_id_idx" ON "SupplierFulfillmentLine"("production_assignment_id");

ALTER TABLE "SupplierFulfillmentLine" ADD CONSTRAINT "SupplierFulfillmentLine_supply_item_id_fkey" FOREIGN KEY ("supply_item_id") REFERENCES "SupplyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
