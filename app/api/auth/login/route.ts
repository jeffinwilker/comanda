import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (!pin || typeof pin !== "string") {
      return new Response(
        JSON.stringify({ error: "PIN obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await prisma.user.findFirst({
      where: { pin, isActive: true },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "PIN inválido" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return Response.json({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (error: any) {
    console.error("Erro em POST /api/auth/login:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao fazer login" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
