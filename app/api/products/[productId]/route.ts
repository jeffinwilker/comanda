import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const { name, priceCents, imageUrl, categoryId, stockQty, stockMin } = await request.json();

    const product = await prisma.product.update({
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
    const { productId } = await params;

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Produto deletado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar produto" }, { status: 500 });
  }
}
