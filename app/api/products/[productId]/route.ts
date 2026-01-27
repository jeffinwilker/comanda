import { getTenantContext } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { productId } = await params;
    const { name, priceCents, imageUrl, categoryId, stockQty, stockMin } = await request.json();

    const existing = await ctx.tenant.product.findUnique({ where: { id: productId } });
    if (!existing) return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });

    const product = await ctx.tenant.product.update({
      where: { id: productId },
      data: {
        name,
        priceCents,
        imageUrl: imageUrl || null,
        categoryId: categoryId === undefined ? undefined : categoryId ? String(categoryId) : null,
        stockQty: Number.isFinite(stockQty) ? Math.max(0, Math.floor(Number(stockQty))) : undefined,
        stockMin: Number.isFinite(stockMin) ? Math.max(0, Math.floor(Number(stockMin))) : undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { productId } = await params;

    const existing = await ctx.tenant.product.findUnique({ where: { id: productId } });
    if (!existing) return NextResponse.json({ error: "Produto nao encontrado" }, { status: 404 });

    await ctx.tenant.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Produto deletado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar produto" }, { status: 500 });
  }
}
