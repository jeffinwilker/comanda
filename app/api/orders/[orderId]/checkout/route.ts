import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return new Response("Pedido não encontrado", { status: 404 });
  }

  if (order.status !== "READY") {
    return new Response("Pedido só pode ir para o caixa quando estiver pronto", { status: 400 });
  }

  if (!order.items || order.items.filter((it) => !it.canceledAt).length === 0) {
    return new Response("Pedido sem itens", { status: 400 });
  }

  const existing = await prisma.printJob.findFirst({
    where: { orderId, status: "PENDING" },
  });

  if (existing) {
    return Response.json(existing);
  }

  const printJob = await prisma.$transaction(async (tx: any) => {
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
