"use client";

import { useAuth } from "@/app/auth-context";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";
import { useEffect, useState } from "react";

interface Table {
  id: string;
  name: string;
  activeOrder?: { status: string } | null;
}

function GarcomPageContent() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const statusLabels: Record<string, { label: string; className: string }> = {
    OPEN: { label: "Em preparação", className: "badge-warning" },
    SENT_TO_KITCHEN: { label: "Em preparação", className: "badge-warning" },
    READY: { label: "Pronto", className: "badge-info" },
    WAITING_PAYMENT: { label: "No caixa", className: "badge-neutral" },
  };

  useEffect(() => {
    async function loadTables() {
      try {
        const res = await fetch("/api/tables", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setTables(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTables();
    const id = setInterval(loadTables, 4000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Carregando mesas</h1>
        <p className="page-subtitle">Aguarde um instante.</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <h1 className="page-title">Selecione uma mesa</h1>
        <p className="page-subtitle">Crie pedidos rapidamente com apenas um toque.</p>

        <div className="grid grid-five">
          {tables.map((t) => (
            <a key={t.id} href={`/garcom/mesa/${t.id}?userId=${user?.id}`} className="tile-link">
              <div className="tile-header">
                <div className="tile-title">{t.name}</div>
                {t.activeOrder ? (
                  <span
                    className={`badge tile-badge ${statusLabels[t.activeOrder.status]?.className || "badge-warning"}`}
                  >
                    {statusLabels[t.activeOrder.status]?.label || t.activeOrder.status}
                  </span>
                ) : (
                  <span className="badge badge-success tile-badge">Livre</span>
                )}
              </div>
              <div className="tile-meta">Abrir comanda</div>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

export default function GarcomPage() {
  return (
    <ProtectedRoute requiredRoles={["GARCOM", "ADMIN"]}>
      <GarcomPageContent />
    </ProtectedRoute>
  );
}
