/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,name]` on the table `contracts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,name]` on the table `shifts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,name]` on the table `skills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,name]` on the table `specializations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,name]` on the table `staff_tags` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "staff_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "profile_picture" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "contract_id" TEXT,
    "supervisor" TEXT,
    "skills" JSONB DEFAULT '[]',
    "certifications" JSONB DEFAULT '[]',
    "roles" JSONB DEFAULT '[]',
    "role_distribution" JSONB DEFAULT '{}',
    "weekly_template" JSONB DEFAULT '{}',
    "pool_assignments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_staff_id_key" ON "staff"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_organization_id_name_key" ON "contracts"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_organization_id_name_key" ON "shifts"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_organization_id_name_key" ON "skills"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "specializations_organization_id_name_key" ON "specializations"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_tags_organization_id_name_key" ON "staff_tags"("organization_id", "name");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
