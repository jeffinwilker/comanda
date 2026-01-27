import { getTenantContext } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const { userId } = await params;

    const existing = await ctx.tenant.user.findFirst({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    await ctx.tenant.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "Usuario deletado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar usuario" }, { status: 500 });
  }
}
