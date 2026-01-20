import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return new Response("Pedido nǜo encontrado", { status: 404 });
  }

  if (!["OPEN", "SENT_TO_KITCHEN", "READY"].includes(order.status)) {
    return new Response("Pedido nǜo pode ser enviado para a cozinha", { status: 400 });
  }

  const updatedItems = await prisma.orderItem.updateMany({
    where: { orderId, sentToKitchenAt: null, canceledAt: null },
    data: { sentToKitchenAt: new Date(), preparedAt: null },
  });

  if (updatedItems.count === 0) {
    return new Response("Nenhum item novo para enviar", { status: 400 });
  }

  if (order.status !== "SENT_TO_KITCHEN") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "SENT_TO_KITCHEN" },
    });
  }

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  return Response.json(updated);
}
