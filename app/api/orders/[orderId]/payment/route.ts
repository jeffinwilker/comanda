import { getTenantContext } from "@/lib/tenant";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return new Response("Empresa nao definida", { status: 400 });

    const { orderId } = await params;
    const { paymentMethod } = await req.json();

    if (!["DINHEIRO", "CARTAO", "PIX"].includes(paymentMethod)) {
      return new Response("Metodo de pagamento invalido", { status: 400 });
    }

    const order = await ctx.tenant.order.findUnique({ where: { id: orderId } });
    if (!order) return new Response("Pedido nao encontrado", { status: 400 });

    const updated = await ctx.tenant.order.update({
      where: { id: orderId },
      data: { paymentMethod },
    });

    return Response.json(updated);
  } catch (error: any) {
    console.error(error);
    return new Response("Erro ao atualizar metodo de pagamento", { status: 500 });
  }
}
