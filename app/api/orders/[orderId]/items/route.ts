import { getTenantContext } from "@/lib/tenant";

const editableStatuses = ["OPEN", "SENT_TO_KITCHEN", "READY"];

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const ctx = await getTenantContext(req);
  if (!ctx) return new Response("Empresa nao definida", { status: 400 });

  const { orderId } = await params;
  const { productId, qty, note } = await req.json();

  const q = Number(qty);
  if (!productId || !Number.isInteger(q) || q <= 0) {
    return new Response("productId e qty validos sao obrigatorios", { status: 400 });
  }

  const order = await ctx.tenant.order.findUnique({ where: { id: orderId } });
  if (!order) return new Response("Pedido nao encontrado", { status: 400 });
  if (!editableStatuses.includes(order.status)) {
    return new Response("Pedido nao esta aberto para alteracoes", { status: 400 });
  }

  const product = await ctx.tenant.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return new Response("Produto indisponivel", { status: 400 });
  }
  if (product.stockQty <= 0) {
    return new Response("Produto sem estoque", { status: 400 });
  }
  if (product.stockQty < q) {
    return new Response("Estoque insuficiente para a quantidade", { status: 400 });
  }

  const item = await ctx.tenant.orderItem.create({
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
  const ctx = await getTenantContext(req);
  if (!ctx) return new Response("Empresa nao definida", { status: 400 });

  const { orderId } = await params;
  const { itemId, reason, canceledBy } = await req.json();

  const order = await ctx.tenant.order.findUnique({ where: { id: orderId } });
  if (!order) return new Response("Pedido nao encontrado", { status: 400 });
  if (!editableStatuses.includes(order.status)) {
    return new Response("Pedido nao esta aberto", { status: 400 });
  }

  const item = await ctx.tenant.orderItem.findUnique({ where: { id: String(itemId) } });
  if (!item || item.orderId !== orderId) {
    return new Response("Item nao encontrado", { status: 404 });
  }
  if (item.canceledAt) {
    return new Response("Item ja foi cancelado", { status: 400 });
  }
  if (item.preparedAt) {
    return new Response("Item ja foi preparado", { status: 400 });
  }

  await ctx.tenant.orderItem.update({
    where: { id: String(itemId) },
    data: {
      canceledAt: new Date(),
      canceledReason: reason ? String(reason).slice(0, 280) : null,
      canceledBy: canceledBy ? String(canceledBy).slice(0, 120) : null,
    },
  });
  return new Response(null, { status: 204 });
}
