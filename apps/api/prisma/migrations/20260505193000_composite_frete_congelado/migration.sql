-- AlterTable
ALTER TABLE "CompositeProduct" ADD COLUMN "frete_insumos_atribuicao_reais" DOUBLE PRECISION;
ALTER TABLE "CompositeProduct" ADD COLUMN "preco_venda_congelado" BOOLEAN NOT NULL DEFAULT false;
