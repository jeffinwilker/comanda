import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const { paymentMethod } = await req.json();

    if (!["DINHEIRO", "CARTAO", "PIX"].includes(paymentMethod)) {
      return new Response("Método de pagamento inválido", { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return new Response("Pedido não encontrado", { status: 400 });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod },
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error(error);
    return new Response("Erro ao atualizar método de pagamento", { status: 500 });
  }
}
