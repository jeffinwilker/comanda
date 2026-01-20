const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function isValidCode(code) {
  return typeof code === "string" && /^[0-9]{4}$/.test(code);
}

function generateCode(used) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    if (!used.has(code)) {
      used.add(code);
      return code;
    }
  }
  throw new Error("Nao foi possivel gerar um codigo unico");
}

async function backfillProducts() {
  const products = await prisma.product.findMany({
    select: { id: true, code: true },
    orderBy: { createdAt: "asc" },
  });
  const used = new Set();
  const updates = [];

  for (const product of products) {
    if (isValidCode(product.code) && !used.has(product.code)) {
      used.add(product.code);
      continue;
    }
    const newCode = generateCode(used);
    updates.push(
      prisma.product.update({
        where: { id: product.id },
        data: { code: newCode },
      })
    );
  }

  if (updates.length) {
    await prisma.$transaction(updates);
  }
}

async function backfillOrders() {
  const orders = await prisma.order.findMany({
    select: { id: true, code: true },
    orderBy: { createdAt: "asc" },
  });
  const used = new Set();
  const updates = [];

  for (const order of orders) {
    if (isValidCode(order.code) && !used.has(order.code)) {
      used.add(order.code);
      continue;
    }
    const newCode = generateCode(used);
    updates.push(
      prisma.order.update({
        where: { id: order.id },
        data: { code: newCode },
      })
    );
  }

  if (updates.length) {
    await prisma.$transaction(updates);
  }
}

async function main() {
  await backfillProducts();
  await backfillOrders();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
