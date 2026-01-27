"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Falha no login");
      }

      const admin = await res.json();
      localStorage.setItem("super_admin", JSON.stringify(admin));
      router.push("/super-admin");
    } catch (err: any) {
      setError(err?.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page page-narrow">
      <h1 className="page-title">Super Admin</h1>
      <p className="page-subtitle">Acesso exclusivo do administrador do sistema.</p>

      <form onSubmit={handleSubmit} className="card stack">
        <div className="field">
          <label className="label">Usuário</label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: comanda"
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label className="label">PIN</label>
          <input
            type="password"
            className="input"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="4 dígitos"
            autoComplete="current-password"
          />
        </div>
        {error ? <div className="card card-soft">{error}</div> : null}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
