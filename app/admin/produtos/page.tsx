"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";
import { useAuth } from "@/app/auth-context";

type Product = { id: string; code?: string | null; name: string; priceCents: number; imageUrl?: string | null };

function AdminProdutosContent() {
  const { getCompanyHeaders } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/products", { cache: "no-store", headers: getCompanyHeaders() });
    setProducts(await res.json());
  }

  useEffect(() => {
    load();
  }, [getCompanyHeaders]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(imageUrl || "");
  }, [imageFile, imageUrl]);

  async function create(e: React.FormEvent) {
    e.preventDefault();

    const n = name.trim();
    const p = Number(price.replace(",", "."));

    if (!n || !Number.isFinite(p)) {
      alert("Preencha nome e preÃ§o (ex: 12,50)");
      return;
    }

    setLoading(true);
    try {
      let uploadedUrl = imageUrl.trim();
      if (imageFile) {
        const data = new FormData();
        data.append("file", imageFile);
        const uploadRes = await fetch("/api/products/upload", {
          method: "POST",
          body: data,
        });
        if (!uploadRes.ok) {
          alert(await uploadRes.text());
          return;
        }
        const payload = await uploadRes.json();
        uploadedUrl = String(payload.url || "");
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: getCompanyHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: n, price: p, imageUrl: uploadedUrl }),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      setName("");
      setPrice("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  return (
    <>
      <Navbar />
      <main className="page page-narrow">
        <h1 className="page-title">Admin - Produtos</h1>
        <p className="page-subtitle">Inclua novos itens no cardÃ¡pio.</p>

        <form onSubmit={create} className="card stack">
          <div className="field">
            <label className="label">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: X-burger"
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">PreÃ§o</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 12,50"
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Imagem (URL)</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Upload de imagem</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="input"
            />
          </div>
          {imagePreview ? (
            <div className="row">
              <img src={imagePreview} alt="Preview" className="image-preview" />
            </div>
          ) : null}
          <button disabled={loading} className="btn btn-primary">
            {loading ? "Salvando..." : "Adicionar produto"}
          </button>
        </form>

        <div className="section">
          <h2 className="page-title" style={{ fontSize: "1.2rem" }}>
            Lista de produtos
          </h2>
          <div className="stack">
            {products.map((p) => (
              <div key={p.id} className="card list-item">
                <div className="row">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="product-thumb" /> : null}
                  <strong>{p.name}</strong>
                  {p.code ? <div className="muted">CÃ³digo: {p.code}</div> : null}
                  <div className="muted">R$ {money(p.priceCents)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default function AdminProdutosPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <AdminProdutosContent />
    </ProtectedRoute>
  );
}
