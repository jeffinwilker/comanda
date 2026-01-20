import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Verificar se já existe dados
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return Response.json({ message: "Dados já foram populados" });
    }

    // Criar usuários
    await prisma.user.createMany({
      data: [
        { name: "João (Garçom)", pin: "1234", role: "GARCOM", isActive: true },
        { name: "Maria (Garçom)", pin: "5678", role: "GARCOM", isActive: true },
        { name: "Chef Pedro (Cozinha)", pin: "2222", role: "COZINHA", isActive: true },
        { name: "Ana (Caixa)", pin: "3333", role: "CAIXA", isActive: true },
        { name: "Admin", pin: "9999", role: "ADMIN", isActive: true },
      ],
    });

    // Criar mesas
    await prisma.table.createMany({
      data: [
        { name: "Mesa 1", isActive: true },
        { name: "Mesa 2", isActive: true },
        { name: "Mesa 3", isActive: true },
        { name: "Mesa 4", isActive: true },
        { name: "Mesa 5", isActive: true },
        { name: "Mesa 6", isActive: true },
        { name: "Balcão 1", isActive: true },
        { name: "Balcão 2", isActive: true },
      ],
    });

    const products = [
      // Bebidas
      { name: "Água", priceCents: 300, isActive: true },
      { name: "Refrigerante (lata)", priceCents: 500, isActive: true },
      { name: "Suco Natural", priceCents: 800, isActive: true },
      { name: "Cerveja", priceCents: 700, isActive: true },
      { name: "Vinho Tinto", priceCents: 3500, isActive: true },

      // Entrada
      { name: "Pão com Manteiga", priceCents: 800, isActive: true },
      { name: "Batata Frita", priceCents: 1500, isActive: true },
      { name: "Bolinhas de Queijo", priceCents: 1200, isActive: true },

      // Pratos Principais
      { name: "Hambúrguer Clássico", priceCents: 2500, isActive: true },
      { name: "Hambúrguer Duplo", priceCents: 3500, isActive: true },
      { name: "Bife à Milanesa", priceCents: 4500, isActive: true },
      { name: "Frango Grelhado", priceCents: 3800, isActive: true },
      { name: "Salmão Grelhado", priceCents: 5500, isActive: true },
      { name: "Pasta Carbonara", priceCents: 3200, isActive: true },
      { name: "Pizza Margherita", priceCents: 2800, isActive: true },
      { name: "Pizza 4 Queijos", priceCents: 3200, isActive: true },

      // Sobremesa
      { name: "Sorvete (bola)", priceCents: 600, isActive: true },
      { name: "Brownie", priceCents: 900, isActive: true },
      { name: "Cheesecake", priceCents: 1200, isActive: true },
    ];

    await prisma.product.createMany({
      data: products.map((product, index) => ({
        ...product,
        code: String(index + 1).padStart(4, "0"),
      })),
    });

    return Response.json({
      message: "Dados populados com sucesso!",
      users: 5,
      tables: 8,
      products: products.length,
    });
  } catch (error: any) {
    console.error("Erro ao popular dados:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao popular dados: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
