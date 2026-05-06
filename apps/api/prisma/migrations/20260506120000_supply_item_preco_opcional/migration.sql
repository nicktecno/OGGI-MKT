-- Preço do insumo passa a ser opcional: precificação na montagem do produto (admin).
ALTER TABLE "SupplyItem" ALTER COLUMN "custo_fornecedor" DROP NOT NULL;
ALTER TABLE "SupplyItem" ALTER COLUMN "frete_ate_executor" DROP NOT NULL;
