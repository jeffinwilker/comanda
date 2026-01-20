import { prisma } from "@/lib/prisma";
import { generateUniqueCode } from "@/lib/codes";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableId, userId } = body;

    if (!tableId || typeof tableId !== "string" || tableId.trim() === "") {
      return new Response(
        JSON.stringify({ error: "tableId obrigatório e deve ser uma string válida" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const existing = await prisma.order.findFirst({
      where: { tableId, status: { in: ["OPEN", "SENT_TO_KITCHEN", "READY"] }, closedAt: null },
      include: { table: true, items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      if (userId && !existing.userId) {
        const updated = await prisma.order.update({
          where: { id: existing.id },
          data: { userId },
          include: { table: true, items: { include: { product: true } } },
        });
        return Response.json(updated);
      }
      return Response.json(existing);
    }

    const code = await generateUniqueCode("order");
    const created = await prisma.order.create({
      data: { tableId, code, userId: userId || null, status: "OPEN", serviceEnabled: true, serviceRateBps: 1000 },
      include: { table: true, items: { include: { product: true } } },
    });

    // Se userId foi fornecido, atualizar depois (alternativa ao create direto)
    if (userId) {
      // Nota: Quando o Prisma for regenerado, podemos usar diretamente em create
      // por enquanto deixamos como está
    }

    return Response.json(created);
  } catch (error: any) {
    console.error("Erro em POST /api/orders/open:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar pedido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
