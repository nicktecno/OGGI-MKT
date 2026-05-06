-- CreateEnum
CREATE TYPE "FiscalDocumentKind" AS ENUM ('CPF', 'CNPJ');

-- AlterTable
ALTER TABLE "PlatformAccount" ADD COLUMN "fiscal_document_kind" "FiscalDocumentKind" NOT NULL DEFAULT 'CPF';
ALTER TABLE "PlatformAccount" ADD COLUMN "fiscal_document" TEXT;
