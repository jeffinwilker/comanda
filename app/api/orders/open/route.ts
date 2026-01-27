import { generateUniqueCode } from "@/lib/codes";
import { getTenantContext } from "@/lib/tenant";

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
    const { tableId, userId } = body;

    if (!tableId || typeof tableId !== "string" || tableId.trim() === "") {
      return new Response(JSON.stringify({ error: "tableId obrigatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const table = await ctx.tenant.table.findFirst({ where: { id: tableId, isActive: true } });
    if (!table) {
      return new Response(JSON.stringify({ error: "Mesa nao encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (userId) {
      const user = await ctx.tenant.user.findFirst({ where: { id: userId, isActive: true } });
      if (!user) {
        return new Response(JSON.stringify({ error: "Usuario nao encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const existing = await ctx.tenant.order.findFirst({
      where: {
        tableId,
        status: { in: ["OPEN", "SENT_TO_KITCHEN", "READY"] },
        closedAt: null,
      },
      include: { table: true, items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      if (userId && !existing.userId) {
        const updated = await ctx.tenant.order.update({
          where: { id: existing.id },
          data: { userId },
          include: { table: true, items: { include: { product: true } } },
        });
        return Response.json(updated);
      }
      return Response.json(existing);
    }

    const code = await generateUniqueCode(ctx.tenant, "order");
    const created = await ctx.tenant.order.create({
      data: {
        tableId,
        companyId: ctx.company.id,
        code,
        userId: userId || null,
        status: "OPEN",
        serviceEnabled: true,
        serviceRateBps: 1000,
      },
      include: { table: true, items: { include: { product: true } } },
    });

    return Response.json(created);
  } catch (error: any) {
    console.error("Erro em POST /api/orders/open:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar pedido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
