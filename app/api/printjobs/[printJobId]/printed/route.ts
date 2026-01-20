import { prisma } from "../../../../../lib/prisma";

function calcTotals(subtotalCents: number, serviceEnabled: boolean, serviceRateBps: number) {
  const serviceCents = serviceEnabled ? Math.round(subtotalCents * (serviceRateBps / 10000)) : 0;
  return { serviceCents, totalCents: subtotalCents + serviceCents };
}

export async function POST(_: Request, { params }: { params: Promise<{ printJobId: string }> }) {
  try {
    const { printJobId } = await params;

    const result = await prisma.$transaction(async (tx: any) => {
      const printJob = await tx.printJob.findUnique({
        where: { id: printJobId },
        include: { order: { include: { items: { include: { product: true } } } } },
      });

      if (!printJob || !printJob.order) {
        throw new Error("Print job não encontrado");
      }

      if (printJob.order.status !== "CLOSED") {
        const subtotalCents = printJob.order.items.reduce(
          (acc: number, it: any) => acc + it.qty * it.product.priceCents,
          0
        );
        const { serviceCents, totalCents } = calcTotals(
          subtotalCents,
          printJob.order.serviceEnabled,
          printJob.order.serviceRateBps
        );

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
