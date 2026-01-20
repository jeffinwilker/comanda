import { prisma } from "@/lib/prisma";

async function isCodeTaken(model: "product" | "order", code: string) {
  if (model === "product") {
    return Boolean(await prisma.product.findUnique({ where: { code } }));
  }
  return Boolean(await prisma.order.findUnique({ where: { code } }));
}

export async function generateUniqueCode(model: "product" | "order") {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    if (!(await isCodeTaken(model, code))) {
      return code;
    }
  }
  throw new Error("Nao foi possivel gerar um codigo unico");
}
