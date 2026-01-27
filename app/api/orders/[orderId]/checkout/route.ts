import { getTenantContext } from "@/lib/tenant";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return new Response("Empresa nao definida", { status: 400 });

  const { orderId } = await params;

  const order = await ctx.tenant.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return new Response("Pedido nao encontrado", { status: 404 });
  }

  if (order.status === "CLOSED" || order.status === "CANCELED") {
    return new Response("Pedido ja foi finalizado", { status: 400 });
  }

  const activeItems = (order.items || []).filter((it) => !it.canceledAt);
  if (activeItems.length === 0) {
    return new Response("Pedido sem itens", { status: 400 });
  }

  const hasPendingKitchen = activeItems.some((it) => it.sentToKitchenAt && !it.preparedAt);
  if (hasPendingKitchen) {
    return new Response("Pedido so pode ir para o caixa apos a cozinha finalizar", { status: 400 });
  }

  const existing = await ctx.tenant.printJob.findFirst({
    where: { orderId, status: "PENDING" },
  });

  if (existing) {
    return Response.json(existing);
  }

  const printJob = await ctx.tenant.$transaction(async (tx: any) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "WAITING_PAYMENT" },
    });

    await tx.order.updateMany({
      where: {
        tableId: order.tableId,
        status: { in: ["OPEN", "SENT_TO_KITCHEN", "READY", "WAITING_PAYMENT"] },
        closedAt: null,
        id: { not: orderId },
      },
      data: { status: "CANCELED", closedAt: new Date() },
    });

    return tx.printJob.create({
      data: { orderId, type: "CUSTOMER_RECEIPT", status: "PENDING" },
    });
  });

  return Response.json(printJob);
}
