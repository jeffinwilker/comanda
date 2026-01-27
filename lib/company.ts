import { masterPrisma } from "@/lib/prisma";

export async function resolveCompanyId(req: Request) {
  const header = req.headers.get("x-company-id");
  if (header) return header;

  const url = new URL(req.url);
  const query = url.searchParams.get("companyId");
  if (query) return query;

  const fallback = await masterPrisma.company.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return fallback?.id || null;
}
