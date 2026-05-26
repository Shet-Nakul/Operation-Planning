-- CreateTable
CREATE TABLE "resource_pools" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "pool_id" TEXT NOT NULL,
    "pool_name" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "primary_role" TEXT,
    "static_pct" INTEGER NOT NULL DEFAULT 50,
    "dynamic_pct" INTEGER NOT NULL DEFAULT 50,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_demand_configs" (
    "id" SERIAL NOT NULL,
    "pool_id" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "demand_matrix" JSONB NOT NULL DEFAULT '[]',
    "weekly_hours" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pool_demand_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_pools_pool_id_key" ON "resource_pools"("pool_id");

-- AddForeignKey
ALTER TABLE "resource_pools" ADD CONSTRAINT "resource_pools_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_demand_configs" ADD CONSTRAINT "pool_demand_configs_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "resource_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
