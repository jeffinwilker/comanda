import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return Response.json(categories);
  } catch (error: any) {
    console.error("Erro em GET /api/categories:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao carregar categorias" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return new Response("name obrigatorio", { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, isActive: true },
    });

    return Response.json(category);
  } catch (error: any) {
    console.error("Erro em POST /api/categories:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao criar categoria" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
