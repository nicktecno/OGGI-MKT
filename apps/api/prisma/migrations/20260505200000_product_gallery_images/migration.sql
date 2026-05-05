-- AlterTable
ALTER TABLE "CompositeProduct" ADD COLUMN "galeria_imagens" JSONB NOT NULL DEFAULT '[]'::jsonb;
