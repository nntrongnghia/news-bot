-- Clear existing embeddings (incompatible dimensions from old model)
UPDATE "articles" SET "embedding" = NULL;

-- Change vector dimension from 1536 to 4096
ALTER TABLE "articles" ALTER COLUMN "embedding" TYPE vector(4096);
