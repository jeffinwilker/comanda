import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;

    if (startDateParam || endDateParam) {
      const now = new Date();
      const [sy, sm, sd] = (startDateParam || now.toISOString().split("T")[0]).split("-").map(Number);
      const [ey, em, ed] = (endDateParam || startDateParam || now.toISOString().split("T")[0]).split("-").map(Number);
      startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    } else {
      const now = new Date();
      const currentMonth = month ? parseInt(month) : now.getMonth() + 1;
      const currentYear = year ? parseInt(year) : now.getFullYear();
      startDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    }

    // Total de pedidos fechados no período
    const totalOrders = await prisma.order.count({
      where: {
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Valor total vendido
    const totalSales = await prisma.order.aggregate({
      where: {
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalCents: true,
      },
    });

    const totalCents = totalSales._sum.totalCents || 0;

    // Vendas por dia
    const allOrders = await prisma.order.findMany({
      where: {
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        closedAt: true,
        totalCents: true,
      },
    });

    const salesByDay: Record<string, { orderCount: number; totalCents: number }> = {};
    function formatLocalDay(date: Date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    allOrders.forEach((order: any) => {
      if (!order.closedAt) return;
      const day = formatLocalDay(new Date(order.closedAt));
      if (!salesByDay[day]) {
        salesByDay[day] = { orderCount: 0, totalCents: 0 };
      }
      salesByDay[day].orderCount++;
      salesByDay[day].totalCents += order.totalCents || 0;
    });

    return Response.json({
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      summary: {
        totalOrders,
        totalCents,
        averageOrderValue: totalOrders > 0 ? Math.round(totalCents / totalOrders) : 0,
      },
      waiterStats: [],
      salesByDay: Object.entries(salesByDay)
        .map(([day, data]) => ({
          day,
          ...data,
        }))
        .sort((a, b) => a.day.localeCompare(b.day)),
    });
  } catch (error: any) {
    console.error("Erro em GET /api/reports:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao carregar relatórios" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
