import { masterPrisma } from "@/lib/prisma";

export async function requireSuperAdmin(req: Request) {
  const adminId = req.headers.get("x-super-admin-id");
  if (!adminId) return null;
  const admin = await masterPrisma.superAdmin.findUnique({ where: { id: adminId } });
  if (!admin || !admin.isActive) return null;
  return admin;
}
