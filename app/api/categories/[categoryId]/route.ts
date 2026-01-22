import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const { categoryId } = await params;
    const { name, isActive } = await request.json();

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name ? String(name).trim() : undefined,
        isActive: isActive === undefined ? undefined : Boolean(isActive),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const { categoryId } = await params;

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Categoria deletada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 });
  }
}
