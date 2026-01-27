import { getTenantPrisma, masterPrisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const companyId = String(body?.companyId || "").trim();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "Empresa inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const company = await masterPrisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tenant = getTenantPrisma(company.dbName);
    let user = await tenant.user.findFirst({
      where: { companyId: company.id, role: "ADMIN", isActive: true },
    });

    if (!user) {
      user = await tenant.user.create({
        data: {
          name: "Admin",
          username: "admin",
          pin: "0000",
          role: "ADMIN",
          isActive: true,
          companyId: company.id,
        },
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
    console.error("Erro em POST /api/super-admin/impersonate:", error);
    return new Response(JSON.stringify({ error: "Erro ao acessar empresa" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
