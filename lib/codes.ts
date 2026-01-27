import { PrismaClient } from "@prisma/client";

type TenantPrisma = PrismaClient;

async function isCodeTaken(db: TenantPrisma, model: "product" | "order", code: string) {
  if (model === "product") {
    return Boolean(await db.product.findUnique({ where: { code } }));
  }
  return Boolean(await db.order.findUnique({ where: { code } }));
}

export async function generateUniqueCode(db: TenantPrisma, model: "product" | "order") {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    if (!(await isCodeTaken(db, model, code))) {
      return code;
    }
  }
  throw new Error("Nao foi possivel gerar um codigo unico");
}
