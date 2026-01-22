import { prisma } from "../../../lib/prisma";
import { generateUniqueCode } from "@/lib/codes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const onlyAvailable = searchParams.get("available") === "1";

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: categoryId ? String(categoryId) : undefined,
      stockQty: onlyAvailable ? { gt: 0 } : undefined,
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return Response.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body?.name || "").trim();
  const rawPriceCents = body?.priceCents;
  const rawPrice = body?.price;
  const imageUrl = String(body?.imageUrl || "").trim();
  const categoryId = body?.categoryId ? String(body.categoryId) : null;
  const stockQty = Number.isFinite(body?.stockQty) ? Math.max(0, Math.floor(Number(body.stockQty))) : 0;
  const stockMin = Number.isFinite(body?.stockMin) ? Math.max(0, Math.floor(Number(body.stockMin))) : 0;

  let priceCents: number | null = null;
  if (Number.isFinite(rawPriceCents)) {
    priceCents = Math.round(Number(rawPriceCents));
  } else if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== "") {
    const price = Number(String(rawPrice).replace(",", "."));
    if (Number.isFinite(price)) {
      priceCents = Math.round(price * 100);
    }
  }

  if (!name || priceCents === null) {
    return new Response("name e preço são obrigatórios", { status: 400 });
  }

  const code = await generateUniqueCode("product");
  const product = await prisma.product.create({
    data: {
      name,
      code,
      priceCents,
      imageUrl: imageUrl || null,
      categoryId: categoryId || null,
      stockQty,
      stockMin,
      isActive: true,
    },
  });

  return Response.json(product);
}
