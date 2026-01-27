import { masterPrisma } from "@/lib/prisma";
import { getTenantContextByCode } from "@/lib/tenant";

export async function POST(req: Request) {
  try {
    const { pin, companyCode, username } = await req.json();

    if (!pin || typeof pin !== "string") {
      return new Response(JSON.stringify({ error: "PIN obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!companyCode || typeof companyCode !== "string") {
      return new Response(JSON.stringify({ error: "Código da empresa obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!username || typeof username !== "string") {
      return new Response(JSON.stringify({ error: "Usuário obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tenantCtx = await getTenantContextByCode(companyCode);
    if (!tenantCtx) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { company, tenant } = tenantCtx;

    const user = await tenant.user.findFirst({
      where: { pin, username: String(username).trim().toLowerCase(), isActive: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json({
      id: user.id,
      name: user.name,
      role: user.role,
      companyId: company.id,
      companyName: company.name,
    });
  } catch (error: any) {
    console.error("Erro em POST /api/auth/login:", error);
    return new Response(JSON.stringify({ error: "Erro ao fazer login" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
