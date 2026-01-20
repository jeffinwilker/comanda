import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        table: true,
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(orders);
  } catch (error: any) {
    console.error("Erro em GET /api/orders:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao carregar pedidos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
