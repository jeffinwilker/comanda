import { masterPrisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const pin = String(body?.pin || "").trim();

    if (!username || !pin) {
      return new Response(JSON.stringify({ error: "UsuÃ¡rio e PIN sÃ£o obrigatÃ³rios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = await masterPrisma.superAdmin.findUnique({ where: { username } });
    if (!admin || !admin.isActive || admin.pin !== pin) {
      return new Response(JSON.stringify({ error: "Credenciais invÃ¡lidas" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json({ id: admin.id, name: admin.name, username: admin.username });
  } catch (error: any) {
    console.error("Erro em POST /api/super-admin/login:", error);
    return new Response(JSON.stringify({ error: "Erro ao autenticar super admin" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
