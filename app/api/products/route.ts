import { generateUniqueCode } from "@/lib/codes";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return new Response("Empresa nao definida", { status: 400 });

    const { searchParams } = new URL(req.url);
    const available = searchParams.get("available");
    const categoryId = searchParams.get("categoryId");

    const products = await ctx.tenant.product.findMany({
      where: {
        isActive: true,
        ...(available ? { stockQty: { gt: 0 } } : {}),
        ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
      },
      orderBy: { name: "asc" },
    });

    return Response.json(products);
  } catch (error: any) {
    console.error("Erro em GET /api/products:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar produtos" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return new Response("Empresa nao definida", { status: 400 });

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const price = Number(body?.price);
    const priceCentsRaw = Number(body?.priceCents);
    const imageUrl = body?.imageUrl ? String(body.imageUrl) : null;
    const stockQty = Number.isFinite(Number(body?.stockQty)) ? Number(body.stockQty) : 0;
    const stockMin = Number.isFinite(Number(body?.stockMin)) ? Number(body.stockMin) : 0;

    const hasPrice = Number.isFinite(price);
    const hasPriceCents = Number.isFinite(priceCentsRaw);
    if (!name || (!hasPrice && !hasPriceCents)) {
      return new Response("Nome e preco sao obrigatorios", { status: 400 });
    }
    const priceCents = hasPriceCents ? Math.round(priceCentsRaw) : Math.round(price * 100);

    const code = await generateUniqueCode(ctx.tenant, "product");
    const product = await ctx.tenant.product.create({
      data: {
        name,
        priceCents,
        imageUrl,
        isActive: true,
        companyId: ctx.company.id,
        code,
        stockQty,
        stockMin,
      },
    });

    return Response.json(product);
  } catch (error: any) {
    console.error("Erro em POST /api/products:", error);
    return new Response(JSON.stringify({ error: "Erro ao criar produto" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
