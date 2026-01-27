import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return new Response("Empresa nao definida", { status: 400 });

    const { orderId } = await params;

    const order = await ctx.tenant.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return new Response("Pedido nao encontrado", { status: 404 });
    }

    return Response.json(order);
  } catch (error: any) {
    console.error(error);
    return new Response("Erro ao buscar pedido", { status: 500 });
  }
}
