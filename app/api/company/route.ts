import { masterPrisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let company = await ctx.tenant.company.findUnique({ where: { id: ctx.company.id } });
    if (!company) {
      company = await ctx.tenant.company.create({
        data: {
          id: ctx.company.id,
          name: ctx.company.name,
          code: ctx.company.code,
          dbName: ctx.company.dbName,
          isActive: ctx.company.isActive,
          logoUrl: ctx.company.logoUrl || null,
          phone: ctx.company.phone || null,
          email: ctx.company.email || null,
          address: ctx.company.address || null,
        },
      });
    }

    return Response.json(company);
  } catch (error: any) {
    console.error("Erro em GET /api/company:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar empresa" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getTenantContext(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Empresa nao definida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const name = body?.name !== undefined ? String(body.name).trim() : undefined;
    const logoUrl = body?.logoUrl !== undefined ? String(body.logoUrl || "").trim() : undefined;
    const phone = body?.phone !== undefined ? String(body.phone || "").trim() : undefined;
    const email = body?.email !== undefined ? String(body.email || "").trim() : undefined;
    const address = body?.address !== undefined ? String(body.address || "").trim() : undefined;

    if (name !== undefined && !name) {
      return new Response(JSON.stringify({ error: "Nome obrigatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = {
      ...(name !== undefined ? { name } : {}),
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(address !== undefined ? { address: address || null } : {}),
    };

    const updated = await ctx.tenant.company.upsert({
      where: { id: ctx.company.id },
      update: data,
      create: {
        id: ctx.company.id,
        name: data.name ?? ctx.company.name,
        code: ctx.company.code,
        dbName: ctx.company.dbName,
        isActive: ctx.company.isActive,
        logoUrl: data.logoUrl ?? ctx.company.logoUrl ?? null,
        phone: data.phone ?? ctx.company.phone ?? null,
        email: data.email ?? ctx.company.email ?? null,
        address: data.address ?? ctx.company.address ?? null,
      },
    });

    try {
      await masterPrisma.company.update({
        where: { id: ctx.company.id },
        data,
      });
    } catch (error) {
      console.error("Erro ao atualizar empresa no master:", error);
      return new Response(
        JSON.stringify({
          error: "Erro ao atualizar empresa no master",
          details: (error as any)?.message || String(error),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return Response.json(updated);
  } catch (error: any) {
    console.error("Erro em PATCH /api/company:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao atualizar empresa",
        details: error?.message || String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
