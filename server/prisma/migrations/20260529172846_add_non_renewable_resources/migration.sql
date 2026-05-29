-- CreateTable
CREATE TABLE "non_renewable_resources" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "resource_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "category" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "stockpile_qty" INTEGER NOT NULL DEFAULT 0,
    "min_required_qty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_renewable_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "non_renewable_resources_resource_id_key" ON "non_renewable_resources"("resource_id");

-- AddForeignKey
ALTER TABLE "non_renewable_resources" ADD CONSTRAINT "non_renewable_resources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
