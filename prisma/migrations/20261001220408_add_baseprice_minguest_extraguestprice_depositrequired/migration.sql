-- AlterTable
ALTER TABLE "party_rooms" ADD COLUMN     "base_price" DECIMAL(10,2) NOT NULL DEFAULT 35000,
ADD COLUMN     "deposit_required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "extra_guest_price" DECIMAL(10,2) NOT NULL DEFAULT 3000,
ADD COLUMN     "min_guests" INTEGER NOT NULL DEFAULT 10;
