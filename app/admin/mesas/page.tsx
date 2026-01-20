"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";

type Table = { id: string; name: string; isActive: boolean };

function AdminMesasContent() {
  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    const res = await fetch("/api/tables", { cache: "no-store" });
    setTables(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      setName("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="page page-narrow">
        <h1 className="page-title">Admin - Mesas</h1>
        <p className="page-subtitle">Cadastre novas mesas rapidamente.</p>

        <form onSubmit={create} className="card row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ex: "Mesa 12"'
            className="input"
          />
          <button disabled={loading} className="btn btn-primary">
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </form>

        <div className="section">
          <div className="grid grid-five">
            {tables.map((t) => (
              <div key={t.id} className="card table-card stack">
                {editingId === t.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="input"
                    />
                    <div className="row">
                      <button
                        onClick={async () => {
                          const updated = editingName.trim();
                          if (!updated) return;
                          const res = await fetch(`/api/tables/${t.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: updated }),
                          });
                          if (res.ok) {
                            setEditingId(null);
                            setEditingName("");
                            await load();
                          }
                        }}
                        className="btn btn-primary"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        className="btn btn-ghost"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>{t.name}</strong>
                    {!t.isActive && <div className="muted">(inativa)</div>}
                    <button
                      onClick={() => {
                        setEditingId(t.id);
                        setEditingName(t.name);
                      }}
                      className="btn btn-warning"
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default function AdminMesasPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <AdminMesasContent />
    </ProtectedRoute>
  );
}
