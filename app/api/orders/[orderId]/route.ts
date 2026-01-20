import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return new Response("Pedido não encontrado", { status: 404 });
    }

    return Response.json(order);
  } catch (error: any) {
    console.error(error);
    return new Response("Erro ao buscar pedido", { status: 500 });
  }
}
