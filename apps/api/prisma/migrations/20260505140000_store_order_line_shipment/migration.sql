-- AlterTable
ALTER TABLE "store_order_lines" ADD COLUMN     "posted_at" TIMESTAMP(3),
ADD COLUMN     "tracking_code" TEXT,
ADD COLUMN     "carrier_name" TEXT;
