import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    const whereCondition: any = {
      closedAt: { not: null },
    };

    if (startDate || endDate) {
      const closedAt: any = {};
      if (startDate) {
        const [sy, sm, sd] = startDate.split("-").map(Number);
        closedAt.gte = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      }
      if (endDate) {
        const [ey, em, ed] = endDate.split("-").map(Number);
        closedAt.lte = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
      whereCondition.closedAt = closedAt;
    }

    if (userId) {
      whereCondition.userId = userId;
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: { select: { id: true, name: true, code: true, priceCents: true } },
          },
        },
      },
      orderBy: { closedAt: "desc" },
    });

    const total = orders.reduce((acc, o) => acc + (o.totalCents || 0), 0);
    const serviceTotal = orders.reduce((acc, o) => acc + (o.serviceCents || 0), 0);

    const itemCounts: Record<string, { name: string; code: string; qty: number }> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product.id;
        if (!itemCounts[key]) {
          itemCounts[key] = {
            name: item.product.name,
            code: item.product.code,
            qty: 0,
          };
        }
        itemCounts[key].qty += item.qty;
      });
    });

    const allItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty);

    const topItems = allItems.slice(0, 10);

    return Response.json({
      orders,
      summary: {
        totalOrders: orders.length,
        totalRevenue: total,
        totalService: serviceTotal,
        averageTicket: orders.length > 0 ? Math.round(total / orders.length) : 0,
      },
      items: allItems,
      topItems,
    });
  } catch (error: any) {
    console.error(error);
    return Response.json(
      { error: "Erro ao buscar histórico", details: error?.message || "" },
      { status: 500 }
    );
  }
}
