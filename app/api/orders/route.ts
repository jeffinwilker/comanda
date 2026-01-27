import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orders = await ctx.tenant.order.findMany({
      include: {
        table: true,
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(orders);
  } catch (error: any) {
    console.error("Erro em GET /api/orders:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar pedidos" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
