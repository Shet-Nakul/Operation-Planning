-- CreateTable
CREATE TABLE "pool_resources" (
    "id" SERIAL NOT NULL,
    "resource_id" TEXT NOT NULL,
    "pool_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weekly_template" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pool_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pool_resources_resource_id_key" ON "pool_resources"("resource_id");

-- AddForeignKey
ALTER TABLE "pool_resources" ADD CONSTRAINT "pool_resources_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "resource_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
