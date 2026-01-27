import { execSync } from "child_process";
import { createTenantDatabase, getTenantDbUrl, getTenantPrisma, masterPrisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function GET(req: Request) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) {
      return new Response(JSON.stringify({ error: "NÃ£o autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const companies = await masterPrisma.company.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(companies);
  } catch (error: any) {
    console.error("Erro em GET /api/companies:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar empresas" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdmin(req);
    if (!admin) {
      return new Response(JSON.stringify({ error: "NÃ£o autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const code = String(body?.code || "").trim().toLowerCase();
    const dbName = String(body?.dbName || `comanda_${code}` || "").trim().toLowerCase();
    const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true;
    const adminUsername = String(body?.adminUsername || "admin").trim().toLowerCase();
    const adminPin = String(body?.adminPin || "").trim();

    if (!name || !code) {
      return new Response(JSON.stringify({ error: "Nome e cÃ³digo sÃ£o obrigatÃ³rios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!adminUsername || !adminPin) {
      return new Response(JSON.stringify({ error: "UsuÃ¡rio e PIN do admin sÃ£o obrigatÃ³rios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const company = await masterPrisma.company.create({
      data: { name, code, dbName, isActive },
    });

    const tenantUrl = getTenantDbUrl(company.dbName);
    try {
      await createTenantDatabase(company.dbName);
      execSync("npx prisma db push --accept-data-loss", {
        env: { ...process.env, MASTER_DATABASE_URL: tenantUrl },
        stdio: "ignore",
      });
      const tenant = getTenantPrisma(company.dbName);
      await tenant.company.create({
        data: {
          id: company.id,
          name: company.name,
          code: company.code,
          dbName: company.dbName,
          isActive: company.isActive,
        },
      });
      await tenant.user.create({
        data: {
          name: "Admin",
          username: adminUsername,
          pin: adminPin,
          role: "ADMIN",
          isActive: true,
          companyId: company.id,
        },
      });
    } catch (error) {
      console.error("Erro ao provisionar banco da empresa:", error);
    }

    return Response.json(company);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return new Response(JSON.stringify({ error: "CÃ³digo ou banco jÃ¡ existe" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Erro em POST /api/companies:", error);
    return new Response(JSON.stringify({ error: "Erro ao criar empresa" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
