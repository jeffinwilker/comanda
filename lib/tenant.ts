import { resolveCompanyId } from "@/lib/company";
import { getTenantPrisma, masterPrisma } from "@/lib/prisma";

export async function getTenantContext(req: Request) {
  const companyId = await resolveCompanyId(req);
  if (!companyId) return null;

  const company = await masterPrisma.company.findUnique({ where: { id: companyId } });
  if (!company || !company.isActive) return null;

  const tenant = getTenantPrisma(company.dbName);
  return { company, tenant };
}

export async function getTenantContextByCode(companyCode: string) {
  const code = String(companyCode || "").trim().toLowerCase();
  if (!code) return null;

  const company = await masterPrisma.company.findFirst({ where: { code, isActive: true } });
  if (!company) return null;

  const tenant = getTenantPrisma(company.dbName);
  return { company, tenant };
}
