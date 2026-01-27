import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  masterPrisma?: PrismaClient;
  tenantClients?: Map<string, PrismaClient>;
};

const masterUrl = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL || "";

export const masterPrisma =
  globalForPrisma.masterPrisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: { db: { url: masterUrl } },
  });

if (!globalForPrisma.tenantClients) {
  globalForPrisma.tenantClients = new Map<string, PrismaClient>();
}

const tenantClients = globalForPrisma.tenantClients;

export function getTenantDbUrl(dbName: string) {
  const template = process.env.TENANT_DATABASE_URL_TEMPLATE;
  if (!template) {
    throw new Error("TENANT_DATABASE_URL_TEMPLATE não definido");
  }
  return template.replace("{db}", dbName);
}

export function getTenantPrisma(dbName: string) {
  const dbUrl = getTenantDbUrl(dbName);
  const existing = tenantClients.get(dbUrl);
  if (existing) return existing;

  const client = new PrismaClient({
    log: ["error", "warn"],
    datasources: { db: { url: dbUrl } },
  });
  tenantClients.set(dbUrl, client);
  return client;
}

export async function createTenantDatabase(dbName: string) {
  try {
    await masterPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.includes("already exists") || message.includes("já existe") || message.includes("42P04")) {
      return;
    }
    throw error;
  }
}

if (process.env.NODE_ENV !== "production") globalForPrisma.masterPrisma = masterPrisma;
