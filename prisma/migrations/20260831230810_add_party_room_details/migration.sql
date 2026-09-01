-- AlterTable
ALTER TABLE "party_rooms" ADD COLUMN     "description" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "includes" TEXT[],
ADD COLUMN     "recommended_for" TEXT;
