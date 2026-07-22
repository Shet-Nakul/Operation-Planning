-- CreateTable
CREATE TABLE "surgery_plan_results" (
    "id" SERIAL NOT NULL,
    "surgery_id" TEXT NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgery_plan_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surgery_plan_results_surgery_id_key" ON "surgery_plan_results"("surgery_id");
