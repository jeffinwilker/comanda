import { getTenantContext } from "@/lib/tenant";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return new Response("Empresa nao definida", { status: 400 });

  const { orderId } = await params;

  const order = await ctx.tenant.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return new Response("Pedido nao encontrado", { status: 404 });
  }

  if (!["OPEN", "SENT_TO_KITCHEN", "READY"].includes(order.status)) {
    return new Response("Pedido nao pode ser enviado para a cozinha", { status: 400 });
  }

  const updatedItems = await ctx.tenant.orderItem.updateMany({
    where: { orderId, sentToKitchenAt: null, canceledAt: null },
    data: { sentToKitchenAt: new Date(), preparedAt: null },
  });

  if (updatedItems.count === 0) {
    return new Response("Nenhum item novo para enviar", { status: 400 });
  }

  if (order.status !== "SENT_TO_KITCHEN") {
    await ctx.tenant.order.update({
      where: { id: orderId },
      data: { status: "SENT_TO_KITCHEN" },
    });
  }

  const updated = await ctx.tenant.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  return Response.json(updated);
}
