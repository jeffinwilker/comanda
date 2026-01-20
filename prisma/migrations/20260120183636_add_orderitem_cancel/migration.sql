/*
  Warnings:

  - Added the required column `code` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "canceledAt" DATETIME;
ALTER TABLE "OrderItem" ADD COLUMN "canceledBy" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "canceledReason" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "serviceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "serviceRateBps" INTEGER NOT NULL DEFAULT 1000,
    "subtotalCents" INTEGER,
    "serviceCents" INTEGER,
    "totalCents" INTEGER,
    "paymentMethod" TEXT,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("closedAt", "createdAt", "id", "paymentMethod", "serviceCents", "serviceEnabled", "serviceRateBps", "status", "subtotalCents", "tableId", "totalCents", "userId") SELECT "closedAt", "createdAt", "id", "paymentMethod", "serviceCents", "serviceEnabled", "serviceRateBps", "status", "subtotalCents", "tableId", "totalCents", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Product" ("createdAt", "id", "imageUrl", "isActive", "name", "priceCents") SELECT "createdAt", "id", "imageUrl", "isActive", "name", "priceCents" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
