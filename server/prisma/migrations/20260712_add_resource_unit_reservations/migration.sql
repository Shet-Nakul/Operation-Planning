-- AlterTable
ALTER TABLE "resource_units" ADD COLUMN     "block_bookings" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "status_till" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "resource_unit_reservations" (
    "id" SERIAL NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "from_datetime" TEXT NOT NULL,
    "to_datetime" TEXT NOT NULL,
    "reason" TEXT,
    "reference_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_unit_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_unit_reservations_reservation_id_key" ON "resource_unit_reservations"("reservation_id");

-- AddForeignKey
ALTER TABLE "resource_unit_reservations" ADD CONSTRAINT "resource_unit_reservations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "resource_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
