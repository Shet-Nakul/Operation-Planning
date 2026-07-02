-- AlterTable
ALTER TABLE "renewable_resource_pools" ADD COLUMN     "reservations" JSONB DEFAULT '[]';
