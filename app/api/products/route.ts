import { prisma } from "../../../lib/prisma";
import { generateUniqueCode } from "@/lib/codes";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
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
    data: { name, code, priceCents, imageUrl: imageUrl || null, isActive: true },
  });

  return Response.json(product);
}
