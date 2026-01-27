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
      where: {
        status: {
          in: ["OPEN", "SENT_TO_KITCHEN", "READY"],
        },
      },
      include: {
        table: true,
        items: {
          where: { canceledAt: null },
          include: { product: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(orders);
  } catch (error: any) {
    console.error("Erro em GET /api/orders/kitchen:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar pedidos" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
