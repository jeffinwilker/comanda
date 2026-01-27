import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tables = await ctx.tenant.table.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        orders: {
          where: {
            status: { in: ["SENT_TO_KITCHEN", "READY", "WAITING_PAYMENT"] },
            closedAt: null,
          },
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    const payload = tables.map((table) => {
      const activeOrder =
        table.orders.find((order) => order.status === "WAITING_PAYMENT") ||
        table.orders.find((order) => {
          if (order.status === "READY") {
            return order.items.some((item) => item.preparedAt && !item.canceledAt);
          }
          if (order.status === "SENT_TO_KITCHEN") {
            return order.items.some((item) => item.sentToKitchenAt && !item.preparedAt && !item.canceledAt);
          }
          return false;
        }) ||
        null;
      return {
        id: table.id,
        name: table.name,
        isActive: table.isActive,
        activeOrder,
      };
    });
    return Response.json(payload);
  } catch (error: any) {
    console.error("Erro em GET /api/tables:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar tabelas" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) return new Response("name obrigatorio", { status: 400 });

    const table = await ctx.tenant.table.create({
      data: { name, isActive: true, companyId: ctx.company.id },
    });

    return Response.json(table);
  } catch (error: any) {
    console.error("Erro em POST /api/tables:", error);
    return new Response(JSON.stringify({ error: "Erro ao criar tabela" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
