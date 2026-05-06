-- CreateEnum
CREATE TYPE "StoreOrderChannel" AS ENUM ('DEMO', 'STRIPE');

-- CreateTable
CREATE TABLE "store_customer_orders" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "channel" "StoreOrderChannel" NOT NULL,
    "stripe_session_id" TEXT,
    "total_brl" DOUBLE PRECISION,
    "delivery" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_order_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_brl" DOUBLE PRECISION NOT NULL,
    "composite_product_id" TEXT NOT NULL,

    CONSTRAINT "store_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_customer_orders_stripe_session_id_key" ON "store_customer_orders"("stripe_session_id");

-- CreateIndex
CREATE INDEX "store_customer_orders_account_id_created_at_idx" ON "store_customer_orders"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "store_order_lines_order_id_idx" ON "store_order_lines"("order_id");

-- AddForeignKey
ALTER TABLE "store_customer_orders" ADD CONSTRAINT "store_customer_orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_lines" ADD CONSTRAINT "store_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
