import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await params;
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: { name },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar mesa" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await params;

    await prisma.table.delete({
      where: { id: tableId },
    });

    return NextResponse.json({ message: "Mesa deletada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar mesa" }, { status: 500 });
  }
}
