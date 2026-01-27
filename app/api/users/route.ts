import { getTenantContext } from "@/lib/tenant";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const users = await ctx.tenant.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Erro em GET /api/users:", error);
    return NextResponse.json({ error: "Erro ao carregar usuarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext(request);
    if (!ctx) return NextResponse.json({ error: "Empresa nao definida" }, { status: 400 });

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const pin = String(body?.pin || "").trim();
    const username = String(body?.username || "").trim().toLowerCase();
    const role = body?.role || "GARCOM";

    if (!name || !pin || !username) {
      return NextResponse.json({ error: "Nome, usuario e PIN sao obrigatorios" }, { status: 400 });
    }

    const user = await ctx.tenant.user.create({
      data: {
        name,
        username,
        pin,
        role,
        isActive: true,
        companyId: ctx.company.id,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Usuario ja existe" }, { status: 400 });
    }
    console.error("Erro em POST /api/users:", error);
    return NextResponse.json({ error: "Erro ao criar usuario" }, { status: 500 });
  }
}
