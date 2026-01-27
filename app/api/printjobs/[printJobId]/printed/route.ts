import { getTenantContext } from "@/lib/tenant";

function calcTotals(subtotalCents: number, serviceEnabled: boolean, serviceRateBps: number) {
  const serviceCents = serviceEnabled ? Math.round(subtotalCents * (serviceRateBps / 10000)) : 0;
  return { serviceCents, totalCents: subtotalCents + serviceCents };
}

export async function POST(req: Request, { params }: { params: Promise<{ printJobId: string }> }) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return new Response("Empresa nao definida", { status: 400 });

    const { printJobId } = await params;

    const result = await ctx.tenant.$transaction(async (tx: any) => {
      const printJob = await tx.printJob.findUnique({
        where: { id: printJobId },
        include: { order: { include: { items: { include: { product: true } } } } },
      });

      if (!printJob || !printJob.order) {
        throw new Error("Print job nao encontrado");
      }

      if (printJob.order.status !== "CLOSED") {
        const activeItems = printJob.order.items.filter((it: any) => !it.canceledAt);
        const subtotalCents = activeItems.reduce((acc: number, it: any) => acc + it.qty * it.product.priceCents, 0);
        const { serviceCents, totalCents } = calcTotals(
          subtotalCents,
          printJob.order.serviceEnabled,
          printJob.order.serviceRateBps
        );

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

        await tx.order.update({
          where: { id: printJob.orderId },
          data: {
            status: "CLOSED",
            closedAt: new Date(),
            subtotalCents,
            serviceCents,
            totalCents,
          },
        });

        await tx.order.updateMany({
          where: {
            tableId: printJob.order.tableId,
            status: { in: ["OPEN", "SENT_TO_KITCHEN", "READY", "WAITING_PAYMENT"] },
            closedAt: null,
            id: { not: printJob.orderId },
          },
          data: { status: "CANCELED", closedAt: new Date() },
        });
      }

      const updated = await tx.printJob.update({
        where: { id: printJobId },
        data: { status: "PRINTED", printedAt: new Date() },
      });

      return { printJob: updated };
    });

    return Response.json(result);
  } catch (error: any) {
    console.error("Erro ao fechar pedido:", error);
    return new Response(error?.message || "Erro ao fechar pedido", { status: 500 });
  }
}

