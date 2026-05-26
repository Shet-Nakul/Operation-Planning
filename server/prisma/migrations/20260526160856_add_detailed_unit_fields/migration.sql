-- AlterTable
ALTER TABLE "resource_units" ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "assigned_to" TEXT,
ADD COLUMN     "estimated_release" TIMESTAMP(3),
ADD COLUMN     "last_released_at" TIMESTAMP(3);
