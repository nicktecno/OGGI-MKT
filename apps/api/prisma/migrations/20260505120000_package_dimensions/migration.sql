-- Pacote para cotação ME: peça pronta (admin) e insumo (fornecedor); envio B2B por linha de fulfillment.
ALTER TABLE "CompositeProduct" ADD COLUMN "pacote_altura_cm" DOUBLE PRECISION NOT NULL DEFAULT 22;
ALTER TABLE "CompositeProduct" ADD COLUMN "pacote_largura_cm" DOUBLE PRECISION NOT NULL DEFAULT 18;
ALTER TABLE "CompositeProduct" ADD COLUMN "pacote_comprimento_cm" DOUBLE PRECISION NOT NULL DEFAULT 8;
ALTER TABLE "CompositeProduct" ADD COLUMN "pacote_peso_kg" DOUBLE PRECISION NOT NULL DEFAULT 0.55;

ALTER TABLE "SupplyItem" ADD COLUMN "pacote_altura_cm" DOUBLE PRECISION NOT NULL DEFAULT 14;
ALTER TABLE "SupplyItem" ADD COLUMN "pacote_largura_cm" DOUBLE PRECISION NOT NULL DEFAULT 12;
ALTER TABLE "SupplyItem" ADD COLUMN "pacote_comprimento_cm" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "SupplyItem" ADD COLUMN "pacote_peso_kg" DOUBLE PRECISION NOT NULL DEFAULT 0.4;

ALTER TABLE "SupplierFulfillmentLine" ADD COLUMN "envio_pacote_altura_cm" DOUBLE PRECISION;
ALTER TABLE "SupplierFulfillmentLine" ADD COLUMN "envio_pacote_largura_cm" DOUBLE PRECISION;
ALTER TABLE "SupplierFulfillmentLine" ADD COLUMN "envio_pacote_comprimento_cm" DOUBLE PRECISION;
ALTER TABLE "SupplierFulfillmentLine" ADD COLUMN "envio_pacote_peso_kg" DOUBLE PRECISION;
ALTER TABLE "SupplierFulfillmentLine" ADD COLUMN "frete_cotado_reais" DOUBLE PRECISION;
