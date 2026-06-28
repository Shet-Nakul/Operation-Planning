-- CreateTable
CREATE TABLE "surgeries" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "surgery_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "infection_type" INTEGER NOT NULL DEFAULT 0,
    "time_windows" JSONB NOT NULL DEFAULT '{}',
    "stages" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surgeries_surgery_id_key" ON "surgeries"("surgery_id");

-- CreateIndex
CREATE UNIQUE INDEX "operation_types_organization_id_category_name_key" ON "operation_types"("organization_id", "category", "name");

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
