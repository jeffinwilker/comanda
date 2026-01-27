"use client";

import { useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(companyCode.trim(), username.trim().toLowerCase(), pin);
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
        <img src="/logo.png" alt="Espetinho do Jardim" className="login-logo" />
        <p className="page-subtitle">Controle rápido de mesas, pedidos e caixa.</p>

        <form onSubmit={handleLogin} className="stack">
          <div className="field">
            <label className="label">Código da empresa</label>
            <input
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              placeholder="Ex: minhaempresa"
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Usuário</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: joao"
              className="input"
            />
          </div>
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

          <button type="submit" disabled={loading || !pin || !companyCode || !username} className="btn btn-primary">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
