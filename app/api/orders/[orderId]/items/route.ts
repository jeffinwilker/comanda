import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { productId, qty, note } = await req.json();

  const q = Number(qty);
  if (!productId || !Number.isInteger(q) || q <= 0) {
    return new Response("productId e qty válidos são obrigatórios", { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return new Response("Pedido não encontrado", { status: 400 });
  if (!["OPEN", "SENT_TO_KITCHEN", "READY"].includes(order.status)) {
    return new Response("Pedido não está aberto para alterações", { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return new Response("Produto indisponível", { status: 400 });
  }
  if (product.stockQty <= 0) {
    return new Response("Produto sem estoque", { status: 400 });
  }
  if (product.stockQty < q) {
    return new Response("Estoque insuficiente para a quantidade", { status: 400 });
  }

  const item = await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      qty: q,
      note: note ? String(note) : null,
      sentToKitchenAt: null,
      preparedAt: null,
    },
  });

  return Response.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { itemId, reason, canceledBy } = await req.json();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return new Response("Pedido não encontrado", { status: 400 });
  if (!["OPEN", "SENT_TO_KITCHEN", "READY"].includes(order.status)) {
    return new Response("Pedido não está aberto", { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({ where: { id: String(itemId) } });
  if (!item || item.orderId !== orderId) {
    return new Response("Item não encontrado", { status: 404 });
  }
  if (item.canceledAt) {
    return new Response("Item já foi cancelado", { status: 400 });
  }
  if (item.preparedAt) {
    return new Response("Item já foi preparado", { status: 400 });
  }

  await prisma.orderItem.update({
    where: { id: String(itemId) },
    data: {
      canceledAt: new Date(),
      canceledReason: reason ? String(reason).slice(0, 280) : null,
      canceledBy: canceledBy ? String(canceledBy).slice(0, 120) : null,
    },
  });
  return new Response(null, { status: 204 });
}
