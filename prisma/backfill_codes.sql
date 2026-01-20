UPDATE "Product"
SET "code" = lower(hex(randomblob(16)))
WHERE "code" IS NULL;

UPDATE "Order"
SET "code" = lower(hex(randomblob(16)))
WHERE "code" IS NULL;
