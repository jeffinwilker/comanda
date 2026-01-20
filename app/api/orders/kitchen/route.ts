import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ["OPEN", "SENT_TO_KITCHEN", "READY"],
        },
      },
      include: {
        table: true,
        items: {
          where: { canceledAt: null },
          include: { product: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(orders);
  } catch (error: any) {
    console.error("Erro em GET /api/orders/kitchen:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao carregar pedidos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
