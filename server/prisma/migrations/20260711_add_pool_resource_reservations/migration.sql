-- AlterTable
ALTER TABLE "pool_resources" ADD COLUMN     "block_bookings" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "pool_resource_reservations" (
    "id" SERIAL NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "reason" TEXT,
    "reference_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pool_resource_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pool_resource_reservations_reservation_id_key" ON "pool_resource_reservations"("reservation_id");

-- AddForeignKey
ALTER TABLE "pool_resource_reservations" ADD CONSTRAINT "pool_resource_reservations_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "pool_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
