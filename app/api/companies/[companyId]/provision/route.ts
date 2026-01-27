import { execSync } from "child_process";
import { createTenantDatabase, getTenantDbUrl, getTenantPrisma, masterPrisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const admin = await requireSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 });
    }

    const { companyId } = await params;
    const company = await masterPrisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Empresa nÃ£o encontrada" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const adminUsername = String(body?.adminUsername || "").trim().toLowerCase();
    const adminPin = String(body?.adminPin || "").trim();

    const tenantUrl = getTenantDbUrl(company.dbName);
    await createTenantDatabase(company.dbName);
    execSync("npx prisma db push --accept-data-loss", {
      env: { ...process.env, MASTER_DATABASE_URL: tenantUrl },
      stdio: "ignore",
    });

    const tenant = getTenantPrisma(company.dbName);
    await tenant.company.upsert({
      where: { id: company.id },
      update: {
        name: company.name,
        code: company.code,
        dbName: company.dbName,
        isActive: company.isActive,
      },
      create: {
        id: company.id,
        name: company.name,
        code: company.code,
        dbName: company.dbName,
        isActive: company.isActive,
      },
    });

    if (adminUsername && adminPin) {
      const existingAdmin = await tenant.user.findFirst({
        where: { role: "ADMIN", companyId: company.id },
      });
      if (!existingAdmin) {
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
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erro ao provisionar banco:", error);
    return NextResponse.json(
      {
        error: "Erro ao provisionar banco",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
