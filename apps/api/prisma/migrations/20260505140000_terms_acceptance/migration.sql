-- AlterTable (nome da tabela = modelo Prisma PlatformAccount)
ALTER TABLE "PlatformAccount" ADD COLUMN "terms_accepted_at" TIMESTAMP(3),
ADD COLUMN "terms_accepted_version" TEXT;
