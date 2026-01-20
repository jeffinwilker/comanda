"use client";

import { useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(pin);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 className="login-title">Comanda</h1>
        <p className="page-subtitle">Controle rápido de mesas, pedidos e caixa.</p>

        <form onSubmit={handleLogin} className="stack">
          <div className="field">
            <label className="label">PIN de acesso</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Digite seu PIN"
              className="input"
              autoFocus
            />
          </div>

          {error && (
            <div className="card card-soft">
              <strong>Falha no login</strong>
              <div>{error}</div>
            </div>
          )}

          <button type="submit" disabled={loading || !pin} className="btn btn-primary">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

      </div>
    </main>
  );
}
