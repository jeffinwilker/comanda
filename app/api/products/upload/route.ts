import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response("Arquivo inválido", { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return new Response("Formato inválido. Envie uma imagem.", { status: 400 });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return new Response("Imagem muito grande (máx. 5MB).", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    const fileName = `${Date.now()}-${safeName}`;
    const folderName = new Date().toISOString().slice(0, 10);

    const uploadDir = path.join(process.cwd(), "public", "uploads", folderName);
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, Buffer.from(arrayBuffer));

    return Response.json({ url: `/uploads/${folderName}/${fileName}` });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    return new Response("Erro ao fazer upload", { status: 500 });
  }
}
