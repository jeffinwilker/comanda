import { prisma } from "@/lib/prisma";

function calcTotals(subtotalCents: number, serviceEnabled: boolean, serviceRateBps: number) {
  const serviceCents = serviceEnabled ? Math.round(subtotalCents * (serviceRateBps / 10000)) : 0;
  return { serviceCents, totalCents: subtotalCents + serviceCents };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const body = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return new Response("Pedido não encontrado", { status: 400 });

  const updateData: any = {};

  // Se vier 'enabled', atualizar serviceEnabled e recalcular totais
  if (body.enabled !== undefined) {
    if (!["OPEN", "SENT_TO_KITCHEN", "READY", "WAITING_PAYMENT", "CLOSED"].includes(order.status)) {
      return new Response("Pedido não pode ser alterado", { status: 400 });
    }
    const enabled = Boolean(body.enabled);
    const subtotalCents = order.items.reduce((acc, it) => acc + it.qty * it.product.priceCents, 0);
    const { serviceCents, totalCents } = calcTotals(subtotalCents, enabled, order.serviceRateBps);
    updateData.serviceEnabled = enabled;
    updateData.subtotalCents = subtotalCents;
    updateData.serviceCents = serviceCents;
    updateData.totalCents = totalCents;
  }

  // Se vier 'status', atualizar status
  if (body.status) {
    updateData.status = body.status;
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (body.status === "READY") {
      await tx.orderItem.updateMany({
        where: { orderId, sentToKitchenAt: { not: null }, preparedAt: null },
        data: { preparedAt: new Date() },
      });
    }

    return updatedOrder;
  });

  return Response.json(updated);
}
