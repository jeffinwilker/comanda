import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const { name, priceCents, imageUrl } = await request.json();

    const product = await prisma.product.update({
      where: { id: productId },
      data: { name, priceCents, imageUrl: imageUrl || null },
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
