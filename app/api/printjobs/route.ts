import { getTenantContext } from "@/lib/tenant";

function calcTotals(subtotalCents: number, serviceEnabled: boolean, serviceRateBps: number) {
  const serviceCents = serviceEnabled ? Math.round(subtotalCents * (serviceRateBps / 10000)) : 0;
  return { serviceCents, totalCents: subtotalCents + serviceCents };
}

export async function GET(req: Request) {
  const ctx = await getTenantContext(req);
  if (!ctx) {
    return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "PENDING").toUpperCase();

  const jobs = await ctx.tenant.printJob.findMany({
    where: { status },
    include: {
      order: {
        include: {
          table: true,
          items: {
            where: { canceledAt: null },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(jobs);
}

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx) {
    return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { orderId } = params;

  const result = await ctx.tenant.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) throw new Error("Pedido nao encontrado");
    if (order.status !== "WAITING_PAYMENT") {
      throw new Error("Pedido nao pode ser fechado no status atual");
    }

    const activeItems = order.items.filter((it: any) => !it.canceledAt);
    const subtotalCents = activeItems.reduce((acc: number, it: any) => acc + it.qty * it.product.priceCents, 0);
    const { serviceCents, totalCents } = calcTotals(subtotalCents, order.serviceEnabled, order.serviceRateBps);

    const qtyByProduct = new Map<string, number>();
    activeItems.forEach((it: any) => {
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + it.qty);
    });

    for (const [productId, qty] of qtyByProduct.entries()) {
      const updated = await tx.product.updateMany({
        where: { id: productId, stockQty: { gte: qty } },
        data: { stockQty: { decrement: qty } },
      });
      if (updated.count === 0) {
        throw new Error("Estoque insuficiente para finalizar o pedido");
      }
    }

    const closed = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        subtotalCents,
        serviceCents,
        totalCents,
      },
    });

    const printJob = await tx.printJob.create({
      data: { orderId, type: "CUSTOMER_RECEIPT", status: "PENDING" },
    });

    return { closed, printJob };
  });

  return Response.json(result);
}
