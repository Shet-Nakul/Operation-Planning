-- Change default from ESTIMATION to DRAFT and backfill existing rows
ALTER TABLE "surgeries" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
UPDATE "surgeries" SET "status" = 'DRAFT' WHERE "status" = 'ESTIMATION';
