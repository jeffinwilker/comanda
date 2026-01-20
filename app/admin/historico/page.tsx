"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function HistoricoContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedUser, setSelectedUser] = useState("");

  async function load() {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedUser) params.append("userId", selectedUser);

      const res = await fetch(`/api/sales/history?${params}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();

      setOrders(data.orders);
      setTopItems(data.topItems);
      setSummary(data.summary);
    } catch (error) {
      console.error(error);
      setOrders([]);
      setTopItems([]);
      setSummary(null);
    }
  }

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/users");
      setUsers(await res.json());
    }
    loadUsers();
  }, []);

  useEffect(() => {
    load();
  }, [startDate, endDate, selectedUser]);

  const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const colors = ["#db4c1e", "#1a7f5a", "#d08b1a", "#24364b", "#6b5b95", "#3f8efc"];

  return (
    <>
      <Navbar />
      <main className="page">
        <h1 className="page-title">Histórico de vendas</h1>
        <p className="page-subtitle">Analise o desempenho por período e garçom.</p>

        <div className="grid grid-tight section">
          <div className="field">
            <label className="label">Data inicial</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </div>

          <div className="field">
            <label className="label">Data final</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
          </div>

          <div className="field">
            <label className="label">Garçom</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="select">
              <option value="">Todos</option>
              {users
                .filter((u) => u.role === "GARCOM")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {summary && (
          <div className="grid grid-auto section">
            <div className="card">
              <div className="label">Total de pedidos</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{summary.totalOrders}</div>
            </div>
            <div className="card">
              <div className="label">Faturamento</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>R$ {money(summary.totalRevenue)}</div>
            </div>
            <div className="card">
              <div className="label">Ticket médio</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>R$ {money(summary.averageTicket)}</div>
            </div>
            <div className="card">
              <div className="label">Total serviço</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>R$ {money(summary.totalService)}</div>
            </div>
          </div>
        )}

        <div className="chart-card section">
          <h2>Itens mais vendidos</h2>
          {topItems.length > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#db4c1e">
                    {topItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">Sem vendas neste período</p>
          )}
        </div>

        <div className="card section">
          <h2>Detalhe de vendas</h2>
          {orders.length === 0 ? (
            <p className="muted">Sem vendas neste período</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Mesa</th>
                    <th>Garçom</th>
                    <th>Itens</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                    <th style={{ textAlign: "right" }}>Serviço</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "center" }}>Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const subtotal = order.items.reduce((acc: number, it: any) => acc + it.qty * it.product.priceCents, 0);
                    return (
                      <tr key={order.id}>
                        <td>{new Date(order.closedAt).toLocaleString("pt-BR")}</td>
                        <td>{order.table.name}</td>
                        <td>{order.user?.name || "-"}</td>
                        <td>{order.items.map((it: any) => `${it.qty}x ${it.product.name}`).join(", ")}</td>
                        <td style={{ textAlign: "right" }}>R$ {money(subtotal)}</td>
                        <td style={{ textAlign: "right" }}>R$ {money(order.serviceCents || 0)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>R$ {money(order.totalCents || 0)}</td>
                        <td style={{ textAlign: "center" }}>{order.paymentMethod || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function HistoricoPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <HistoricoContent />
    </ProtectedRoute>
  );
}
