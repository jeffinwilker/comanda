import { prisma } from "@/lib/prisma";

function calcTotals(subtotalCents: number, serviceEnabled: boolean, serviceRateBps: number) {
  const serviceCents = serviceEnabled ? Math.round(subtotalCents * (serviceRateBps / 10000)) : 0;
  return { serviceCents, totalCents: subtotalCents + serviceCents };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "PENDING").toUpperCase();

  const jobs = await prisma.printJob.findMany({
    where: { status },
    include: {
      order: {
        include: {
          table: true,
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(jobs);
}

export async function POST(_: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;

  const result = await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) throw new Error("Pedido não encontrado");
    if (order.status !== "WAITING_PAYMENT") {
      throw new Error("Pedido não pode ser fechado no status atual");
    }

    const subtotalCents = order.items.reduce((acc: number, it: any) => acc + it.qty * it.product.priceCents, 0);
    const { serviceCents, totalCents } = calcTotals(subtotalCents, order.serviceEnabled, order.serviceRateBps);

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
