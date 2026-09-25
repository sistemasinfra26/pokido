-- DropForeignKey
ALTER TABLE "cash_shifts" DROP CONSTRAINT "cash_shifts_cash_register_id_fkey";

-- AlterTable
ALTER TABLE "cash_shifts" ALTER COLUMN "cash_register_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
