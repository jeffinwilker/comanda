import { getTenantContext } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { tableId } = await params;
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }

    const existing = await ctx.tenant.table.findUnique({ where: { id: tableId } });
    if (!existing) {
      return NextResponse.json({ error: "Mesa nao encontrada" }, { status: 404 });
    }

    const table = await ctx.tenant.table.update({
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
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { tableId } = await params;

    const existing = await ctx.tenant.table.findUnique({ where: { id: tableId } });
    if (!existing) {
      return NextResponse.json({ error: "Mesa nao encontrada" }, { status: 404 });
    }

    await ctx.tenant.table.delete({
      where: { id: tableId },
    });

    return NextResponse.json({ message: "Mesa deletada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar mesa" }, { status: 500 });
  }
}
