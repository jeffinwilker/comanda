/*
  Warnings:

  - You are about to drop the column `name` on the `Table` table. All the data in that column will be lost.

*/
-- RedoTable "Order"
PRAGMA foreign_keys=OFF;
CREATE TABLE "Order_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "serviceEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "serviceRateBps" INTEGER NOT NULL DEFAULT 1000,
    "subtotalCents" INTEGER,
    "serviceCents" INTEGER,
    "totalCents" INTEGER,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "Order_new" ("closedAt", "createdAt", "id", "serviceEnabled", "serviceRateBps", "serviceCents", "status", "subtotalCents", "tableId", "totalCents") SELECT "closedAt", "createdAt", "id", "serviceEnabled", "serviceRateBps", "serviceCents", "status", "subtotalCents", "tableId", "totalCents" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "Order_new" RENAME TO "Order";
PRAGMA foreign_keys=ON;
