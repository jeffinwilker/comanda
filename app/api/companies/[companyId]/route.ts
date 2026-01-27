import { masterPrisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 });
    }

    const { companyId } = await params;
    const body = await request.json();
    const name = body?.name !== undefined ? String(body.name).trim() : undefined;
    const code = body?.code !== undefined ? String(body.code).trim().toLowerCase() : undefined;
    const dbName = body?.dbName !== undefined ? String(body.dbName).trim().toLowerCase() : undefined;
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Nome Ã© obrigatÃ³rio" }, { status: 400 });
    }
    if (code !== undefined && !code) {
      return NextResponse.json({ error: "CÃ³digo Ã© obrigatÃ³rio" }, { status: 400 });
    }

    const existing = await masterPrisma.company.findUnique({ where: { id: companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Empresa nÃ£o encontrada" }, { status: 404 });
    }

    const updated = await masterPrisma.company.update({
      where: { id: companyId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(dbName !== undefined ? { dbName } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "CÃ³digo ou banco jÃ¡ existe" }, { status: 400 });
    }
    console.error("Erro em PATCH /api/companies:", error);
    return NextResponse.json({ error: "Erro ao atualizar empresa" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 });
    }

    const { companyId } = await params;
    await masterPrisma.company.delete({ where: { id: companyId } });
    return NextResponse.json({ message: "Empresa removida" });
  } catch (error: any) {
    console.error("Erro em DELETE /api/companies:", error);
    return NextResponse.json({ error: "Erro ao remover empresa" }, { status: 500 });
  }
}
