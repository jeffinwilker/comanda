import { execSync } from "child_process";
import { getTenantDbUrl, getTenantPrisma, masterPrisma, createTenantDatabase } from "@/lib/prisma";

export async function POST() {
  try {
    const superAdminUsername = String(process.env.SUPER_ADMIN_USERNAME || "comanda").trim().toLowerCase();
    const superAdminPin = String(process.env.SUPER_ADMIN_PIN || "016220").trim();

    if (superAdminUsername && superAdminPin) {
      await masterPrisma.superAdmin.upsert({
        where: { username: superAdminUsername },
        update: { pin: superAdminPin, isActive: true },
        create: {
          name: "Super Admin",
          username: superAdminUsername,
          pin: superAdminPin,
          isActive: true,
        },
      });
    }

    const existingCompanies = await masterPrisma.company.count();
    if (existingCompanies > 0) {
      return Response.json({ message: "Dados ja foram populados" });
    }

    const company = await masterPrisma.company.create({
      data: { name: "Empresa Demo", code: "demo", dbName: "comanda_demo", isActive: true },
    });

    const tenantUrl = getTenantDbUrl(company.dbName);
    let tenantProvisioned = false;
    let tenantError: string | null = null;

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

      await tenant.user.createMany({
        data: [
          { name: "Joao (Garcom)", username: "joao", pin: "1234", role: "GARCOM", isActive: true, companyId: company.id },
          { name: "Maria (Garcom)", username: "maria", pin: "5678", role: "GARCOM", isActive: true, companyId: company.id },
          { name: "Chef Pedro (Cozinha)", username: "cozinha", pin: "2222", role: "COZINHA", isActive: true, companyId: company.id },
          { name: "Ana (Caixa)", username: "caixa", pin: "3333", role: "CAIXA", isActive: true, companyId: company.id },
          { name: "Admin", username: "admin", pin: "9999", role: "ADMIN", isActive: true, companyId: company.id },
        ],
      });

      await tenant.table.createMany({
        data: [
          { name: "Mesa 1", isActive: true, companyId: company.id },
          { name: "Mesa 2", isActive: true, companyId: company.id },
          { name: "Mesa 3", isActive: true, companyId: company.id },
          { name: "Mesa 4", isActive: true, companyId: company.id },
          { name: "Mesa 5", isActive: true, companyId: company.id },
          { name: "Mesa 6", isActive: true, companyId: company.id },
          { name: "Balcao 1", isActive: true, companyId: company.id },
          { name: "Balcao 2", isActive: true, companyId: company.id },
        ],
      });

      const products = [
        { name: "Agua", priceCents: 300, isActive: true },
        { name: "Refrigerante (lata)", priceCents: 500, isActive: true },
        { name: "Suco Natural", priceCents: 800, isActive: true },
        { name: "Cerveja", priceCents: 700, isActive: true },
        { name: "Vinho Tinto", priceCents: 3500, isActive: true },
        { name: "Pao com Manteiga", priceCents: 800, isActive: true },
        { name: "Batata Frita", priceCents: 1500, isActive: true },
        { name: "Bolinhas de Queijo", priceCents: 1200, isActive: true },
        { name: "Hamburguer Classico", priceCents: 2500, isActive: true },
        { name: "Hamburguer Duplo", priceCents: 3500, isActive: true },
        { name: "Bife a Milanesa", priceCents: 4500, isActive: true },
        { name: "Frango Grelhado", priceCents: 3800, isActive: true },
        { name: "Salmao Grelhado", priceCents: 5500, isActive: true },
        { name: "Pasta Carbonara", priceCents: 3200, isActive: true },
        { name: "Pizza Margherita", priceCents: 2800, isActive: true },
        { name: "Pizza 4 Queijos", priceCents: 3200, isActive: true },
        { name: "Sorvete (bola)", priceCents: 600, isActive: true },
        { name: "Brownie", priceCents: 900, isActive: true },
        { name: "Cheesecake", priceCents: 1200, isActive: true },
      ];

      await tenant.product.createMany({
        data: products.map((product, index) => ({
          ...product,
          companyId: company.id,
          code: String(index + 1).padStart(4, "0"),
        })),
      });

      tenantProvisioned = true;
    } catch (error: any) {
      console.error("Erro ao provisionar tenant:", error);
      tenantError = error?.message || "Erro ao provisionar tenant";
    }

    return Response.json({
      message: tenantProvisioned ? "Dados populados com sucesso!" : "Super admin criado. Tenant não provisionado.",
      tenantProvisioned,
      tenantError,
      company: { id: company.id, code: company.code, dbName: company.dbName },
    });
  } catch (error: any) {
    console.error("Erro ao popular dados:", error);
    return new Response(JSON.stringify({ error: "Erro ao popular dados: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
