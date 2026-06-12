-- Add contract_id to contracts table
ALTER TABLE "contracts" ADD COLUMN "contract_id" VARCHAR(255);

-- Set existing contracts' contract_id (we'll use id and type to generate it)
UPDATE "contracts" SET "contract_id" = CASE WHEN type = 'STATIC' THEN 'STA-000' || id::TEXT ELSE 'DYA-000' || id::TEXT END WHERE "contract_id" IS NULL;

-- Make contract_id required and unique
ALTER TABLE "contracts" ALTER COLUMN "contract_id" SET NOT NULL;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contract_id_key" UNIQUE ("contract_id");
