"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";
import { useAuth } from "@/app/auth-context";

function CaixaPageContent() {
  const { getCompanyHeaders } = useAuth();
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [closedJobs, setClosedJobs] = useState<any[]>([]);
  const [tab, setTab] = useState<"pending" | "closed">("pending");

  async function load() {
    const [pendingRes, closedRes] = await Promise.all([
      fetch("/api/printjobs?status=PENDING", { cache: "no-store", headers: getCompanyHeaders() }),
      fetch("/api/printjobs?status=PRINTED", { cache: "no-store", headers: getCompanyHeaders() }),
    ]);
    setPendingJobs(await pendingRes.json());
    setClosedJobs(await closedRes.json());
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [getCompanyHeaders]);

  async function closeAndPrint(printJobId: string, orderId: string) {
    const res = await fetch(`/api/printjobs/${printJobId}/printed`, {
      method: "POST",
      headers: getCompanyHeaders(),
    });
    if (!res.ok) {
      const message = await res.text();
      alert(message || "Erro ao fechar pedido");
      return;
    }
    await load();
    window.open(`/print/order?orderId=${orderId}`, "_blank");
  }

  async function updateService(orderId: string, enabled: boolean) {
    const res = await fetch(`/api/orders/${orderId}/service`, {
      method: "PATCH",
      headers: getCompanyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await load();
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <h1 className="page-title">Caixa</h1>
        <p className="page-subtitle">Contas pendentes para finalizar.</p>

        <div className="row section">
          <button
            onClick={() => setTab("pending")}
            className={`btn ${tab === "pending" ? "btn-primary" : "btn-ghost"}`}
          >
            Aguardando
          </button>
          <button
            onClick={() => setTab("closed")}
            className={`btn ${tab === "closed" ? "btn-primary" : "btn-ghost"}`}
          >
            Fechados
          </button>
        </div>

        {tab === "pending" && pendingJobs.length === 0 ? (
          <div className="status-note">Sem contas pendentes!</div>
        ) : null}

        {tab === "closed" && closedJobs.length === 0 ? (
          <div className="status-note">Sem pedidos fechados!</div>
        ) : null}

        <div className="grid grid-auto section">
          {(tab === "pending" ? pendingJobs : closedJobs).map((j) => (
            <div key={j.id} className="card">
              <div className="row-between">
                <div>
                  <h3 style={{ margin: 0 }}>{j.order.table.name}</h3>
                  {j.order.code ? <div className="muted">Código: {j.order.code}</div> : null}
                </div>
                <span className={`badge ${tab === "pending" ? "badge-warning" : "badge-success"}`}>
                  {tab === "pending" ? "Aguardando" : "Fechado"}
                </span>
              </div>

              <div className="card section">
                <div className="row-between">
                  <span>Total</span>
                  <strong>
                    R$ {((j.order.totalCents || 0) / 100).toFixed(2).replace(".", ",")}
                  </strong>
                </div>
                <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  {j.order.items?.length || 0} item(ns)
                </div>

                <div className="section">
                  <label className="label">Método de pagamento</label>
                  <select
                    value={j.order.paymentMethod || ""}
                    onChange={(e) => {
                      fetch(`/api/orders/${j.orderId}/payment`, {
                        method: "PATCH",
                        headers: getCompanyHeaders({ "Content-Type": "application/json" }),
                        body: JSON.stringify({ paymentMethod: e.target.value }),
                      }).then(() => load());
                    }}
                    className="select"
                  >
                    <option value="">Selecione...</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="PIX">PIX</option>
                  </select>
                  {j.order.paymentMethod && (
                    <div className="badge badge-success" style={{ marginTop: 6 }}>
                      {j.order.paymentMethod}
                    </div>
                  )}
                </div>
              </div>

              <div className="stack">
                {tab === "pending" ? (
                  <button onClick={() => closeAndPrint(j.id, j.orderId)} className="btn btn-secondary">
                    Fechar pedido
                  </button>
                ) : (
                  <>
                    <label className="row">
                      <input
                        type="checkbox"
                        checked={Boolean(j.order.serviceEnabled)}
                        onChange={(e) => updateService(j.orderId, e.target.checked)}
                      />
                      <span>Incluir taxa de serviço (10%)</span>
                    </label>
                    <div className="row">
                      <button
                        onClick={() => window.open(`/print/order?orderId=${j.orderId}`, "_blank")}
                        className="btn btn-secondary"
                      >
                        Ver cupom
                      </button>
                      <button
                        onClick={() => window.open(`/print/order?orderId=${j.orderId}`, "_blank")}
                        className="btn btn-ghost"
                      >
                        Baixar PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default function CaixaPage() {
  return (
    <ProtectedRoute requiredRoles={["CAIXA", "ADMIN"]}>
      <CaixaPageContent />
    </ProtectedRoute>
  );
}
