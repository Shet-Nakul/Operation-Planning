-- AlterTable
ALTER TABLE "surgeries" ADD COLUMN     "department" TEXT,
ADD COLUMN     "department_id" INTEGER;

-- AddForeignKey
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
