-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('ADMIN', 'SUPPLIER', 'EXECUTOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "PlatformAccountStatus" AS ENUM ('PENDING_ADMIN_REVIEW', 'ACTIVE', 'REJECTED');

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "status" "PlatformAccountStatus" NOT NULL DEFAULT 'PENDING_ADMIN_REVIEW',
    "stripe_account_id" TEXT,
    "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_email" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProfile" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_complement" TEXT,
    "city" TEXT NOT NULL,
    "state_uf" TEXT NOT NULL,

    CONSTRAINT "SupplierProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutorProfile" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_complement" TEXT,
    "city" TEXT NOT NULL,
    "state_uf" TEXT NOT NULL,

    CONSTRAINT "ExecutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyItem" (
    "id" TEXT NOT NULL,
    "supplier_account_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku_interno" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "custo_fornecedor" DOUBLE PRECISION NOT NULL,
    "frete_ate_executor" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_email_key" ON "PlatformAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_account_id_key" ON "SupplierProfile"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutorProfile_account_id_key" ON "ExecutorProfile"("account_id");

-- CreateIndex
CREATE INDEX "SupplyItem_supplier_account_id_idx" ON "SupplyItem"("supplier_account_id");

-- AddForeignKey
ALTER TABLE "SupplierProfile" ADD CONSTRAINT "SupplierProfile_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutorProfile" ADD CONSTRAINT "ExecutorProfile_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyItem" ADD CONSTRAINT "SupplyItem_supplier_account_id_fkey" FOREIGN KEY ("supplier_account_id") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
