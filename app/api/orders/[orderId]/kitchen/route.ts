import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return new Response("Pedido não encontrado", { status: 404 });
  }

  if (order.status !== "OPEN") {
    return new Response("Pedido não pode ser enviado para a cozinha", { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SENT_TO_KITCHEN" },
  });

  await prisma.orderItem.updateMany({
    where: { orderId, sentToKitchenAt: null },
    data: { sentToKitchenAt: new Date(), preparedAt: null },
  });

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  return Response.json(updated);
}
