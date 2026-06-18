/*
  Warnings:

  - Added the required column `alias` to the `shifts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contracts" ALTER COLUMN "contract_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "resource_pools" ADD COLUMN     "department_id" INTEGER;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "alias" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "department_id" INTEGER;

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rosterings" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "employee_centric" JSONB NOT NULL,
    "pool_centric" JSONB NOT NULL,
    "date_centric" JSONB NOT NULL,
    "stats" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rosterings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_name_key" ON "departments"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "rosterings_organization_id_year_month_key" ON "rosterings"("organization_id", "year", "month");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_pools" ADD CONSTRAINT "resource_pools_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rosterings" ADD CONSTRAINT "rosterings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
