import { getTenantContext } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { categoryId } = await params;
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }

    const existing = await ctx.tenant.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Categoria nao encontrada" }, { status: 404 });
    }

    const category = await ctx.tenant.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { categoryId } = await params;

    const existing = await ctx.tenant.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: "Categoria nao encontrada" }, { status: 404 });
    }

    await ctx.tenant.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Categoria deletada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 });
  }
}
