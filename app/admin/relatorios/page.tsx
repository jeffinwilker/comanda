"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function RelatoriosPageContent() {
  const [tab, setTab] = useState<"resumo" | "historico" | "pedidos" | "produtos">("resumo");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  async function loadReport(m: number, y: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?month=${m}&year=${y}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar relatorio");
      }
      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(month, year);
  }, [month, year]);

  return (
    <>
      <Navbar />
      <main className="page">
        <h1 className="page-title">Relatórios de vendas</h1>
        <p className="page-subtitle">Resumo mensal e histórico detalhado.</p>

        <div className="row section">
          <button onClick={() => setTab("resumo")} className={`btn ${tab === "resumo" ? "btn-primary" : "btn-ghost"}`}>
            Resumo mensal
          </button>
          <button onClick={() => setTab("historico")} className={`btn ${tab === "historico" ? "btn-primary" : "btn-ghost"}`}>
            Histórico detalhado
          </button>
          <button onClick={() => setTab("pedidos")} className={`btn ${tab === "pedidos" ? "btn-primary" : "btn-ghost"}`}>
            Pedidos por data
          </button>
          <button onClick={() => setTab("produtos")} className={`btn ${tab === "produtos" ? "btn-primary" : "btn-ghost"}`}>
            Produtos vendidos
          </button>
        </div>

        {tab === "resumo" && (
          <div>
            <div className="grid grid-tight section">
              <div className="field">
                <label className="label">Mês</label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="select">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleDateString("pt-BR", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Ano</label>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="select">
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="muted">Carregando relatório...</p>
            ) : error || !report ? (
              <div className="card card-soft">{error || "Nenhum dado disponível para este período"}</div>
            ) : (
              <>
                <div className="grid grid-auto section">
                  <div className="card">
                    <div className="label">Total de pedidos</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{report.summary.totalOrders}</div>
                  </div>
                  <div className="card">
                    <div className="label">Receita total</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>R$ {money(report.summary.totalCents)}</div>
                  </div>
                  <div className="card">
                    <div className="label">Ticket médio</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>R$ {money(report.summary.averageOrderValue)}</div>
                  </div>
                </div>

                {report.salesByDay && report.salesByDay.length > 0 && (
                  <div className="chart-card section">
                    <h2>Receita diária</h2>
                    <div className="chart-area">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={report.salesByDay}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="day"
                            tickFormatter={(value) =>
                              new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                            }
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value: any) => `R$ ${(value / 100).toFixed(2).replace(".", ",")}`}
                            labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("pt-BR")}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="totalCents"
                            stroke="#db4c1e"
                            name="Receita (R$)"
                            dot={{ fill: "#db4c1e", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {report.salesByDay && report.salesByDay.length > 0 && (
                  <div className="chart-card section">
                    <h2>Pedidos por dia</h2>
                    <div className="chart-area">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.salesByDay}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="day"
                            tickFormatter={(value) =>
                              new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                            }
                          />
                          <YAxis />
                          <Tooltip labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("pt-BR")} />
                          <Legend />
                          <Bar dataKey="orderCount" fill="#1a7f5a" name="Quantidade de pedidos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="card section">
                  <h2>Detalhes diários</h2>
                  <div style={{ overflowX: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th style={{ textAlign: "right" }}>Pedidos</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.salesByDay.map((day) => (
                          <tr key={day.day}>
                            <td>{new Date(day.day + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                            <td style={{ textAlign: "right" }}>{day.orderCount}</td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>R$ {money(day.totalCents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "historico" && <HistoricoDetalhado />}
        {tab === "pedidos" && <PedidosPorData />}
        {tab === "produtos" && <ProdutosVendidos />}
      </main>
    </>
  );
}

function HistoricoDetalhado() {
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
  }, []);

  const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const colors = ["#db4c1e", "#1a7f5a", "#d08b1a", "#24364b", "#6b5b95", "#3f8efc"];

  return (
    <div className="section">
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

      <button onClick={load} className="btn btn-primary">
        Pesquisar
      </button>

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
        <h3>Itens mais vendidos</h3>
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

      {topItems.length > 0 && (
        <div className="card section">
          <h3>Produtos mais vendidos</h3>
          <div className="stack">
            {topItems.slice(0, 5).map((item) => (
              <div key={item.name} className="row-between">
                <strong>{item.name}</strong>
                <span className="muted">{item.qty}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Detalhe de vendas</h3>
        {orders.length === 0 ? (
          <p className="muted">Sem vendas neste período</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
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
                      <td className="muted">{order.code || "-"}</td>
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
    </div>
  );
}

function PedidosPorData() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (date) {
        params.append("startDate", date);
        params.append("endDate", date);
      }
      const res = await fetch(`/api/sales/history?${params}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch (e: any) {
      console.error(e);
      setOrders([]);
      setItems([]);
      setSummary(null);
      setError(e?.message || "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const totalItems = items.reduce((acc, item) => acc + (item.qty || 0), 0);

  return (
    <div className="section">
      <div className="grid grid-tight section">
        <div className="field">
          <label className="label">Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      <button onClick={load} className="btn btn-primary">
        Pesquisar
      </button>

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : error ? (
        <div className="card card-soft">{error}</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-auto section">
              <div className="card">
                <div className="label">Total de pedidos</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{summary.totalOrders}</div>
              </div>
              <div className="card">
                <div className="label">Quantidade vendida</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalItems}</div>
              </div>
              <div className="card">
                <div className="label">Faturamento</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>R$ {money(summary.totalRevenue)}</div>
              </div>
            </div>
          )}

          <div className="card section">
            <h3>Produtos vendidos</h3>
            {items.length === 0 ? (
              <p className="muted">Sem vendas nesta data</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ textAlign: "right" }}>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "right" }}>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Lista de pedidos</h3>
            {orders.length === 0 ? (
              <p className="muted">Sem pedidos nesta data</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Data/Hora</th>
                      <th>Mesa</th>
                      <th>Garçom</th>
                      <th>Itens</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "center" }}>Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="muted">{order.code || "-"}</td>
                        <td>{new Date(order.closedAt).toLocaleString("pt-BR")}</td>
                        <td>{order.table?.name || "-"}</td>
                        <td>{order.user?.name || "-"}</td>
                        <td>{order.items.map((it: any) => `${it.qty}x ${it.product.name}`).join(", ")}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>R$ {money(order.totalCents || 0)}</td>
                        <td style={{ textAlign: "center" }}>{order.paymentMethod || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProdutosVendidos() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const res = await fetch(`/api/sales/history?${params}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch (e: any) {
      console.error(e);
      setItems([]);
      setSummary(null);
      setError(e?.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalQty = items.reduce((acc, item) => acc + (item.qty || 0), 0);

  return (
    <div className="section">
      <div className="grid grid-tight section">
        <div className="field">
          <label className="label">Data inicial</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
        </div>
        <div className="field">
          <label className="label">Data final</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
        </div>
      </div>

      <button onClick={load} className="btn btn-primary">
        Pesquisar
      </button>

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : error ? (
        <div className="card card-soft">{error}</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-auto section">
              <div className="card">
                <div className="label">Total de pedidos</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{summary.totalOrders}</div>
              </div>
              <div className="card">
                <div className="label">Quantidade vendida</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalQty}</div>
              </div>
            </div>
          )}

          <div className="card">
            <h3>Produtos vendidos</h3>
            {items.length === 0 ? (
              <p className="muted">Sem vendas neste período</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Produto</th>
                      <th style={{ textAlign: "right" }}>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.code || item.name}>
                        <td className="muted">{item.code || "-"}</td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "right" }}>{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function RelatoriosPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <RelatoriosPageContent />
    </ProtectedRoute>
  );
}
