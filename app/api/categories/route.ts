import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return new Response("Empresa nao definida", { status: 400 });

    const categories = await ctx.tenant.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return Response.json(categories);
  } catch (error: any) {
    console.error("Erro em GET /api/categories:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar categorias" }), {
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
    if (!name) return new Response("Nome obrigatorio", { status: 400 });

    const category = await ctx.tenant.category.create({
      data: { name, isActive: true, companyId: ctx.company.id },
    });

    return Response.json(category);
  } catch (error: any) {
    console.error("Erro em POST /api/categories:", error);
    return new Response(JSON.stringify({ error: "Erro ao criar categoria" }), {
      status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
