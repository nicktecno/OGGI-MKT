-- CreateTable
CREATE TABLE "CompositeProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "descricao_curta" TEXT NOT NULL,
    "linhas" JSONB NOT NULL,
    "executor_fee_planejada" DOUBLE PRECISION NOT NULL,
    "platform_fee_planejada" DOUBLE PRECISION NOT NULL,
    "preco_venda_publico" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL,
    "admin_pausado" BOOLEAN NOT NULL,
    "imagem_url" TEXT NOT NULL,

    CONSTRAINT "CompositeProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionRequest" (
    "id" TEXT NOT NULL,
    "composite_product_id" TEXT NOT NULL,
    "executor_email" TEXT NOT NULL,
    "executor_nome" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,

    CONSTRAINT "ExecutionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionAssignment" (
    "id" TEXT NOT NULL,
    "composite_product_id" TEXT NOT NULL,
    "executor_email" TEXT NOT NULL,
    "executor_nome" TEXT NOT NULL,
    "cidade_origem" TEXT NOT NULL,
    "cep_origem" TEXT NOT NULL,
    "available_quantity" INTEGER NOT NULL,
    "units_produced" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "assignment_source" TEXT NOT NULL,
    "execution_request_id" TEXT,

    CONSTRAINT "ProductionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompositeProduct_slug_key" ON "CompositeProduct"("slug");

-- CreateIndex
CREATE INDEX "ExecutionRequest_composite_product_id_idx" ON "ExecutionRequest"("composite_product_id");

-- CreateIndex
CREATE INDEX "ProductionAssignment_composite_product_id_idx" ON "ProductionAssignment"("composite_product_id");
