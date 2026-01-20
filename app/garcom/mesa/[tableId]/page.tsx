"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";

type Product = { id: string; name: string; priceCents: number; imageUrl?: string | null };
type OrderItem = {
  id: string;
  qty: number;
  note?: string | null;
  product: Product;
  sentToKitchenAt?: string | null;
  preparedAt?: string | null;
  canceledAt?: string | null;
  canceledReason?: string | null;
  canceledBy?: string | null;
};
type Order = {
  id: string;
  status: string;
  serviceEnabled: boolean;
  serviceRateBps: number;
  items: OrderItem[];
  table?: { name: string };
};

function MesaPageContent({ params }: { params: Promise<{ tableId: string }> | { tableId: string } }) {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [tableId, setTableId] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  async function loadOrder(tid: string, silent = false) {
    if (!silent) {
      setLoadingOrder(true);
    }
    setError(null);
    try {
      if (!tid) throw new Error("tableId não foi fornecido");
      const res = await fetch("/api/orders/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: tid, userId: userId || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOrder(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (!silent) {
        setLoadingOrder(false);
      }
    }
  }

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao carregar produtos");
      const data = await res.json();
      setProducts(data);
      if (data.length && !productId) setProductId(data[0].id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      const tid = resolvedParams.tableId;
      if (!tid) {
        setError("tableId não foi fornecido");
        setLoadingOrder(false);
        setLoadingProducts(false);
        return;
      }
      setTableId(tid);
      loadProducts();
      loadOrder(tid);
    };
    resolveParams();
  }, [params]);

  const subtotalCents = useMemo(() => {
    if (!order) return 0;
    return order.items
      .filter((it) => !it.canceledAt)
      .reduce((acc, it) => acc + it.qty * it.product.priceCents, 0);
  }, [order]);

  const serviceCents = useMemo(() => {
    if (!order) return 0;
    if (!order.serviceEnabled) return 0;
    return Math.round(subtotalCents * (order.serviceRateBps / 10000));
  }, [order, subtotalCents]);

  const totalCents = subtotalCents + serviceCents;

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    const q = Number(qty);
    if (!productId || !Number.isInteger(q) || q <= 0) {
      setToast("Escolha um produto e uma quantidade válida");
      return;
    }
    try {
      const res = await fetch(`/api/orders/${order.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: q, note: note.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setQty("1");
      setNote("");
      if (tableId) await loadOrder(tableId, true);
    } catch (e: any) {
      setToast(e.message);
    }
  }

  function openCancelModal(itemId: string) {
    setCancelItemId(itemId);
    setCancelReason("");
    setCancelError(null);
  }

  function closeCancelModal() {
    setCancelItemId(null);
    setCancelReason("");
    setCancelError(null);
    setCanceling(false);
  }

  async function cancelItem(itemId: string, reason: string) {
    if (!order) return;
    try {
      setCanceling(true);
      const res = await fetch(`/api/orders/${order.id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, reason: reason || null, canceledBy: userId || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (tableId) await loadOrder(tableId, true);
      closeCancelModal();
    } catch (e: any) {
      setCancelError(e.message);
      setCanceling(false);
    }
  }

  async function toggleService() {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order.id}/service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !order.serviceEnabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (tableId) await loadOrder(tableId, true);
    } catch (e: any) {
      setToast(e.message);
    }
  }

  async function sendToKitchen() {
    if (!order || order.items.filter((it) => !it.canceledAt).length === 0) {
      setToast("Adicione itens antes de enviar!");
      return;
    }
    try {
      const res = await fetch(`/api/orders/${order.id}/kitchen`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      if (tableId) await loadOrder(tableId, true);
      setToast("Pedido enviado para a cozinha!");
    } catch (e: any) {
      setToast(e.message);
    }
  }

  async function requestCheckout() {
    if (!order || order.items.filter((it) => !it.canceledAt).length === 0) {
      setToast("Adicione itens antes de fechar!");
      return;
    }
    try {
      const res = await fetch(`/api/orders/${order.id}/checkout`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setToast("Pedido enviado para o caixa!");
      window.location.href = "/garcom";
    } catch (e: any) {
      setToast(e.message);
    }
  }

  if (loadingOrder || loadingProducts) {
    return (
      <main className="page page-narrow">
        <h1 className="page-title">Mesa</h1>
        <p className="page-subtitle">Carregando dados da comanda.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page page-narrow">
        <h1 className="page-title">Mesa</h1>
        <div className="card card-soft">
          <strong>Erro</strong>
          <div>{error}</div>
          <button onClick={() => tableId && (loadProducts(), loadOrder(tableId))} className="btn btn-ghost">
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!order) return <div className="page page-narrow">Carregando pedido...</div>;

  const headerName = order.table?.name || tableId || "";
  const displayTitle = headerName.toLowerCase().startsWith("mesa") ? headerName : `Mesa ${headerName}`;

  return (
    <>
      <Navbar />
      {toast && <div className="toast">{toast}</div>}
      {cancelItemId && (
        <div className="modal-backdrop" onClick={closeCancelModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Cancelar item</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Informe o motivo do cancelamento.
            </p>
            <div className="stack">
              <div className="row">
                {["Lancado errado", "Cliente desistiu", "Cozinha demorou", "Pedido duplicado"].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setCancelReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Detalhe o motivo"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              {cancelError ? <div className="card card-soft">{cancelError}</div> : null}
              <div className="row">
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={canceling || !cancelReason.trim()}
                  onClick={() => cancelItem(cancelItemId, cancelReason.trim())}
                >
                  {canceling ? "Cancelando..." : "Confirmar cancelamento"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={closeCancelModal}>
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="page page-narrow">
        <a href="/garcom" className="back-link">← Voltar para mesas</a>
        <h1 className="page-title">{displayTitle}</h1>
        {order?.code ? <div className="muted">Código do pedido: {order.code}</div> : null}
        <p className="page-subtitle">Envie para a cozinha e feche quando estiver pronto.</p>

        <form onSubmit={addItem} className="card stack">
          <div className="field">
            <label className="label">Produto</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="select">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - R$ {money(p.priceCents)}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Quantidade</label>
              <input value={qty} onChange={(e) => setQty(e.target.value)} className="input" />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label className="label">Observação</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
            </div>
          </div>
          <button className="btn btn-success">Adicionar item</button>
        </form>

        <div className="card section">
          <label className="row">
            <input type="checkbox" checked={order.serviceEnabled} onChange={toggleService} />
            <span>Incluir taxa de serviço (10%)</span>
          </label>
        </div>

        <div className="section">
          <h2 className="page-title" style={{ fontSize: "1.2rem" }}>
            Itens da comanda
          </h2>
          {order.items.length === 0 ? (
            <p className="muted">Nenhum item adicionado.</p>
          ) : (
            <div className="stack">
              {order.items.map((it) => {
                const isCanceled = Boolean(it.canceledAt);
                const canCancel = !isCanceled && !it.preparedAt;
                return (
                  <div key={it.id} className="card list-item">
                    <div>
                      <div style={{ textDecoration: isCanceled ? "line-through" : "none", opacity: isCanceled ? 0.6 : 1 }}>
                        <strong>
                          {it.qty}x {it.product.name}
                        </strong>
                      </div>
                      {it.note && <div className="muted">Obs: {it.note}</div>}
                      {isCanceled ? (
                        <div className="badge badge-neutral" style={{ marginTop: 6 }}>
                          Cancelado
                        </div>
                      ) : null}
                      {isCanceled && it.canceledReason ? (
                        <div className="muted">Motivo: {it.canceledReason}</div>
                      ) : null}
                      <div className="muted">R$ {money(it.qty * it.product.priceCents)}</div>
                    </div>
                    {canCancel ? (
                      <button onClick={() => openCancelModal(it.id)} className="btn btn-danger">
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card card-strong section">
          <div className="row-between">
            <span>Subtotal</span>
            <strong>R$ {money(subtotalCents)}</strong>
          </div>
          {order.serviceEnabled && (
            <div className="row-between" style={{ marginTop: 6 }}>
              <span>Serviço (10%)</span>
              <strong>R$ {money(serviceCents)}</strong>
            </div>
          )}
          <div className="row-between" style={{ marginTop: 12, fontSize: "1.1rem" }}>
            <span>Total</span>
            <strong>R$ {money(totalCents)}</strong>
          </div>
        </div>

        <div className="row" style={{ marginTop: 8, alignItems: "stretch" }}>
          <button
            onClick={sendToKitchen}
            className="btn btn-secondary"
            disabled={
              !order ||
              order.items.filter((it) => !it.canceledAt).length === 0 ||
              !["OPEN", "SENT_TO_KITCHEN", "READY"].includes(order.status)
            }
          >
            Enviar para cozinha
          </button>
          <button
            onClick={requestCheckout}
            className="btn btn-success"
            disabled={!order || order.items.filter((it) => !it.canceledAt).length === 0 || order.status !== "READY"}
          >
            Fechar pedido
          </button>
        </div>
      </main>
    </>
  );
}

export default function MesaPage({ params }: { params: Promise<{ tableId: string }> | { tableId: string } }) {
  return (
    <ProtectedRoute requiredRoles={["GARCOM", "ADMIN"]}>
      <MesaPageContent params={params} />
    </ProtectedRoute>
  );
}
