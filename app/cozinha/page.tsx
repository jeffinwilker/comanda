"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";

interface OrderItem {
  id: string;
  qty: number;
  note?: string;
  product: { name: string };
  sentToKitchenAt?: string | null;
  preparedAt?: string | null;
}

interface KitchenOrder {
  id: string;
  tableId: string;
  table: { name: string };
  items: OrderItem[];
  status: string;
  createdAt: string;
}

function CozinhaPageContent() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [tab, setTab] = useState<"pending" | "ready">("pending");

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const showAlert = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    playNotificationSound();
    setTimeout(() => setShowNotification(false), 4000);
  };

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders/kitchen", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const pendingCount = data.filter((o: KitchenOrder) => o.status === "SENT_TO_KITCHEN").length;

        if (pendingCount > lastOrderCount && lastOrderCount > 0) {
          const newOrders = pendingCount - lastOrderCount;
          showAlert(`${newOrders} novo${newOrders > 1 ? "s" : ""} pedido${newOrders > 1 ? "s" : ""}!`);
        }

        setLastOrderCount(pendingCount);
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    const id = setInterval(loadOrders, 2000);
    return () => clearInterval(id);
  }, [lastOrderCount]);

  async function markReady(orderId: string) {
    try {
      await fetch(`/api/orders/${orderId}/service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });
      await loadOrders();
    } catch (e) {
      console.error(e);
    }
  }

  const pendingOrders = orders
    .filter((o) => o.status === "SENT_TO_KITCHEN")
    .map((o) => ({
      ...o,
      items: o.items.filter((it) => it.sentToKitchenAt && !it.preparedAt),
    }))
    .filter((o) => o.items.length > 0);
  const readyOrders = orders
    .filter((o) => o.status === "READY")
    .map((o) => ({
      ...o,
      items: o.items.filter((it) => it.preparedAt),
    }))
    .filter((o) => o.items.length > 0);

  return (
    <>
      <Navbar />

      {showNotification && <div className="toast">{notificationMessage}</div>}

      <main className="page">
        <h1 className="page-title">Cozinha</h1>
        <p className="page-subtitle">
          Pedidos pendentes {pendingOrders.length > 0 && <span className="badge badge-warning">{pendingOrders.length}</span>}
        </p>

        {loading && <p className="muted">Carregando...</p>}

        <div className="row section">
          <button
            onClick={() => setTab("pending")}
            className={`btn ${tab === "pending" ? "btn-primary" : "btn-ghost"}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setTab("ready")}
            className={`btn ${tab === "ready" ? "btn-primary" : "btn-ghost"}`}
          >
            Despachados
          </button>
        </div>

        {tab === "pending" && pendingOrders.length === 0 ? (
          <div className="status-note">Sem pedidos pendentes!</div>
        ) : null}

        {tab === "ready" && readyOrders.length === 0 ? (
          <div className="status-note">Sem pedidos despachados!</div>
        ) : null}

        <div className="grid grid-auto section">
          {(tab === "pending" ? pendingOrders : readyOrders).map((order) => (
            <div key={order.id} className="card card-soft">
              <div className="row-between">
                <div>
                  <h3 style={{ margin: "0 0 4px 0" }}>Mesa {order.table.name}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                  </p>
                </div>
                <span className={`badge ${tab === "pending" ? "badge-warning" : "badge-success"}`}>
                  {tab === "pending" ? "Pendente" : "Despachado"}
                </span>
              </div>

              <div className="card section" style={{ background: "var(--surface)" }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {order.items.map((item) => (
                    <li key={item.id} style={{ marginBottom: 8 }}>
                      <strong>
                        {item.qty}x {item.product.name}
                      </strong>
                      {item.note && <div className="muted">Obs: {item.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>

              {tab === "pending" ? (
                <button onClick={() => markReady(order.id)} className="btn btn-success" style={{ width: "100%" }}>
                  Pronto para servir
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default function CozinhaPage() {
  return (
    <ProtectedRoute requiredRoles={["COZINHA", "ADMIN"]}>
      <CozinhaPageContent />
    </ProtectedRoute>
  );
}
