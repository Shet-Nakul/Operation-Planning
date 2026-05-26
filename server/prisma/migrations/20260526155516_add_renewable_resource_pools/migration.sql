-- CreateTable
CREATE TABLE "renewable_resource_pools" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "pool_id" TEXT NOT NULL,
    "pool_name" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "total_capacity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewable_resource_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_units" (
    "id" SERIAL NOT NULL,
    "pool_id" INTEGER NOT NULL,
    "unit_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "variant" TEXT,
    "attributes" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "renewable_resource_pools_pool_id_key" ON "renewable_resource_pools"("pool_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_units_unit_id_key" ON "resource_units"("unit_id");

-- AddForeignKey
ALTER TABLE "renewable_resource_pools" ADD CONSTRAINT "renewable_resource_pools_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_units" ADD CONSTRAINT "resource_units_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "renewable_resource_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
