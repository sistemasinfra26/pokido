/*
  Warnings:

  - A unique constraint covering the columns `[mp_preference_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mp_payment_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('POS', 'WEB');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "channel" "SalesChannel" NOT NULL DEFAULT 'POS',
ADD COLUMN     "mp_payment_id" TEXT,
ADD COLUMN     "mp_preference_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_mp_preference_id_key" ON "orders"("mp_preference_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_mp_payment_id_key" ON "orders"("mp_payment_id");
