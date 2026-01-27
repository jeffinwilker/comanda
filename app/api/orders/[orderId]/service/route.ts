import { getTenantContext } from "@/lib/tenant";

function calcTotals(subtotalCents: number, serviceEnabled: boolean, serviceRateBps: number) {
  const serviceCents = serviceEnabled ? Math.round(subtotalCents * (serviceRateBps / 10000)) : 0;
  return { serviceCents, totalCents: subtotalCents + serviceCents };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return new Response("Empresa nao definida", { status: 400 });

  const { orderId } = await params;
  const body = await req.json();

  const order = await ctx.tenant.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return new Response("Pedido nao encontrado", { status: 400 });

  const updateData: any = {};

  if (body.enabled !== undefined) {
    if (!["OPEN", "SENT_TO_KITCHEN", "READY", "WAITING_PAYMENT", "CLOSED"].includes(order.status)) {
      return new Response("Pedido nao pode ser alterado", { status: 400 });
    }
    const enabled = Boolean(body.enabled);
    const subtotalCents = order.items
      .filter((it) => !it.canceledAt)
      .reduce((acc, it) => acc + it.qty * it.product.priceCents, 0);
    const { serviceCents, totalCents } = calcTotals(subtotalCents, enabled, order.serviceRateBps);
    updateData.serviceEnabled = enabled;
    updateData.subtotalCents = subtotalCents;
    updateData.serviceCents = serviceCents;
    updateData.totalCents = totalCents;
  }

  if (body.status) {
    updateData.status = body.status;
  }

  const updated = await ctx.tenant.$transaction(async (tx: any) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (body.status === "READY") {
      await tx.orderItem.updateMany({
        where: { orderId, sentToKitchenAt: { not: null }, preparedAt: null, canceledAt: null },
        data: { preparedAt: new Date() },
      });
    }

    return updatedOrder;
  });

  return Response.json(updated);
}
