"use client";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";
import { useState, useEffect } from "react";
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
  Cell,
} from "recharts";

type DateRange = { start: string; end: string };

function buildCompanyHeaders(extra: HeadersInit = {}) {
  const headers = new Headers(extra);
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.companyId) {
          headers.set("x-company-id", parsed.companyId);
        }
      }
    } catch {
      // ignore parse issues
    }
  }
  return headers;
}

function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, { ...init, headers: buildCompanyHeaders(init.headers || {}) });
}

function formatDateInput(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMonthRange(year: number, month: number): DateRange {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

function getPresetRange(preset: "today" | "week" | "lastWeek" | "month" | "lastMonth"): DateRange {
  const now = new Date();

  if (preset === "today") {
    const today = formatDateInput(now);
    return { start: today, end: today };
  }

  if (preset === "week" || preset === "lastWeek") {
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = current.getDay();
    const diff = (day + 6) % 7;
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - diff);
    if (preset === "lastWeek") {
      weekStart.setDate(weekStart.getDate() - 7);
    }
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: formatDateInput(weekStart), end: formatDateInput(weekEnd) };
  }

  if (preset === "lastMonth") {
    const month = now.getMonth();
    const year = now.getFullYear();
    const prevMonth = month === 0 ? 12 : month;
    const prevYear = month === 0 ? year - 1 : year;
    return getMonthRange(prevYear, prevMonth);
  }

  return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

function MenuIcon({ id }: { id: string }) {
  switch (id) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"
            fill="currentColor"
          />
        </svg>
      );
    case "products":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </svg>
      );
    case "relatorios":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20V10" />
          <path d="M12 20V4" />
          <path d="M20 20V14" />
          <path d="M3 20h18" />
        </svg>
      );
    case "tables":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M9 5v14M15 5v14" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.8-3 4.6-5 8-5s6.2 2 8 5" />
        </svg>
      );
    case "caixa":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
          <circle cx="9" cy="6" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="11" cy="18" r="2" />
        </svg>
      );
    default:
      return null;
  }
}

function AdminDashboardContent() {
  const [section, setSection] = useState<
    "home" | "products" | "categories" | "tables" | "users" | "relatorios" | "caixa" | "settings"
  >("home");
  const [productsMenuOpen, setProductsMenuOpen] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function loadCompany() {
      try {
        const res = await authFetch("/api/company");
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setCompanyLogo(data?.logoUrl || null);
          setCompanyName(data?.name || "");
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadCompany();
    const handleCompanyUpdated = () => loadCompany();
    window.addEventListener("company-updated", handleCompanyUpdated);
    return () => {
      active = false;
      window.removeEventListener("company-updated", handleCompanyUpdated);
    };
  }, []);

  const menuItems = [
    { id: "relatorios", label: "Relatórios" },
    { id: "tables", label: "Mesas" },
    { id: "users", label: "Usuários" },
    { id: "caixa", label: "Caixa" },
    { id: "settings", label: "Configuração" },
  ];

  return (
    <>
      <Navbar />
      <main className="admin-layout">
        <nav className="admin-sidebar">
          <div>
            {companyLogo ? (
              <div className="company-brand">
                <img src={companyLogo} alt={companyName || "Logo da empresa"} />
                {companyName ? <span>{companyName}</span> : null}
              </div>
            ) : null}
            <div className="pill" style={{ marginBottom: 12 }}>
              Administração
            </div>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              Controle geral do sistema.
            </div>
          </div>

          <button
            onClick={() => setSection("home")}
            className={`nav-item ${section === "home" ? "active" : ""}`}
          >
            <span className="nav-icon">
              <MenuIcon id="home" />
            </span>
            Dashboard
          </button>

          <button
            onClick={() => {
              setProductsMenuOpen(!productsMenuOpen);
              if (section !== "products" && section !== "categories") {
                setSection("products");
              }
            }}
            className={`nav-item ${section === "products" || section === "categories" ? "active" : ""}`}
          >
            <span className="nav-icon">
              <MenuIcon id="products" />
            </span>
            Produtos
          </button>
          {productsMenuOpen ? (
            <div className="stack" style={{ gap: 8 }}>
              <button
                onClick={() => setSection("products")}
                className={`nav-item nav-sub ${section === "products" ? "active" : ""}`}
              >
                Lista de produtos
              </button>
              <button
                onClick={() => setSection("categories")}
                className={`nav-item nav-sub ${section === "categories" ? "active" : ""}`}
              >
                Categorias
              </button>
            </div>
          ) : null}

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as any)}
              className={`nav-item ${section === item.id ? "active" : ""}`}
            >
              <span className="nav-icon">
                <MenuIcon id={item.id} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-content">
          {section === "home" && <DashboardHome />}
          {section === "relatorios" && <RelatoriosSection />}
          {section === "products" && <ProductsSection />}
          {section === "categories" && <CategoriesSection />}
          {section === "settings" && <CompanySettingsSection />}
          {section === "tables" && <TablesSection />}
          {section === "users" && <UsersSection />}
          {section === "caixa" && <ClosedOrdersSection />}
        </div>
      </main>
    </>
  );
}

function DashboardHome() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const ordersRes = await authFetch("/api/orders").catch(() => null);
        const productsRes = await authFetch("/api/products").catch(() => null);
        const tablesRes = await authFetch("/api/tables").catch(() => null);
        const usersRes = await authFetch("/api/users").catch(() => null);

        const orders = ordersRes && ordersRes.ok ? await ordersRes.json() : [];
        const products = productsRes && productsRes.ok ? await productsRes.json() : [];
        const tables = tablesRes && tablesRes.ok ? await tablesRes.json() : [];
        const users = usersRes && usersRes.ok ? await usersRes.json() : [];

        const totalCents = Array.isArray(orders) ? orders.reduce((acc: number, o: any) => acc + (o.totalCents || 0), 0) : 0;
        const closedOrders = Array.isArray(orders) ? orders.filter((o: any) => o.status === "CLOSED").length : 0;
        const avgOrderValue = closedOrders > 0 ? Math.round(totalCents / closedOrders) : 0;

        setStats({
          totalOrders: Array.isArray(orders) ? orders.length : 0,
          totalCents,
          averageOrderValue: avgOrderValue,
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalTables: Array.isArray(tables) ? tables.length : 0,
          totalUsers: Array.isArray(users) ? users.length : 0,
          closedOrders,
        });
      } catch (e) {
        console.error(e);
        setStats({
          totalOrders: 0,
          totalCents: 0,
          averageOrderValue: 0,
          totalProducts: 0,
          totalTables: 0,
          totalUsers: 0,
          closedOrders: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  return (
    <div>
      <h1 className="page-title">Dashboard administrativo</h1>
      <p className="page-subtitle">Visão geral do desempenho.</p>

      {loading ? (
        <p className="muted">Carregando dados...</p>
      ) : (
        <>
          <div className="grid grid-auto section">
            <div className="card">
              <div className="label">Pedidos totais</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{stats.totalOrders}</div>
            </div>
            <div className="card">
              <div className="label">Pedidos fechados</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{stats.closedOrders}</div>
            </div>
            <div className="card">
              <div className="label">Receita total</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>R$ {money(stats.totalCents)}</div>
            </div>
            <div className="card">
              <div className="label">Ticket médio</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>R$ {money(stats.averageOrderValue)}</div>
            </div>
            <div className="card">
              <div className="label">Produtos</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{stats.totalProducts}</div>
            </div>
            <div className="card">
              <div className="label">Mesas / Usuários</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                {stats.totalTables} / {stats.totalUsers}
              </div>
            </div>
          </div>

          <div className="card card-soft">
            Selecione uma opção no menu para gerenciar os dados.
          </div>
        </>
      )}
    </div>
  );
}

function RelatoriosSection() {
  const [tab, setTab] = useState<"resumo" | "historico" | "produtos">("resumo");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [summaryStartDate, setSummaryStartDate] = useState(() => getMonthRange(new Date().getFullYear(), new Date().getMonth() + 1).start);
  const [summaryEndDate, setSummaryEndDate] = useState(() => getMonthRange(new Date().getFullYear(), new Date().getMonth() + 1).end);

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  async function loadReport(startDate: string, endDate: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);
      const res = await authFetch(`/api/reports?${params}`);
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
    loadReport(summaryStartDate, summaryEndDate);
  }, [summaryStartDate, summaryEndDate]);

  function applySummaryRange(range: DateRange) {
    const [sy, sm] = range.start.split("-").map(Number);
    setYear(sy);
    setMonth(sm);
    setSummaryStartDate(range.start);
    setSummaryEndDate(range.end);
  }

  return (
    <div>
      <h2 className="page-title">Relatórios de vendas</h2>
      <div className="row section">
        <button onClick={() => setTab("resumo")} className={`btn ${tab === "resumo" ? "btn-primary" : "btn-ghost"}`}>
          Resumo mensal
        </button>
        <button onClick={() => setTab("historico")} className={`btn ${tab === "historico" ? "btn-primary" : "btn-ghost"}`}>
          Histórico detalhado
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
              <select
                value={month}
                onChange={(e) => {
                  const nextMonth = parseInt(e.target.value);
                  setMonth(nextMonth);
                  applySummaryRange(getMonthRange(year, nextMonth));
                }}
                className="select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(year, i).toLocaleDateString("pt-BR", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Ano</label>
              <select
                value={year}
                onChange={(e) => {
                  const nextYear = parseInt(e.target.value);
                  setYear(nextYear);
                  applySummaryRange(getMonthRange(nextYear, month));
                }}
                className="select"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row section">
            <button onClick={() => applySummaryRange(getPresetRange("today"))} className="btn btn-ghost">
              Hoje
            </button>
            <button onClick={() => applySummaryRange(getPresetRange("week"))} className="btn btn-ghost">
              Semana
            </button>
            <button onClick={() => applySummaryRange(getPresetRange("lastWeek"))} className="btn btn-ghost">
              Semana passada
            </button>
            <button onClick={() => applySummaryRange(getPresetRange("month"))} className="btn btn-ghost">
              Mês atual
            </button>
            <button onClick={() => applySummaryRange(getPresetRange("lastMonth"))} className="btn btn-ghost">
              Mês passado
            </button>
          </div>

          {loading ? (
            <p className="muted">Carregando relatórios...</p>
          ) : error || !report ? (
            <div className="card card-soft">{error || "Erro ao carregar dados"}</div>
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
                <h3>Receita diária</h3>
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
                <h3>Pedidos por dia</h3>
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
              <h3>Detalhes diários</h3>
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
                      {report.salesByDay.map((day: any) => (
                        <tr key={day.day}>
                          <td>{new Date(day.day + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                          <td style={{ textAlign: "right" }}>{day.orderCount}</td>
                          <td style={{ textAlign: "right" }}>R$ {money(day.totalCents)}</td>
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

      {tab === "historico" && <RelatoriosHistoricoTab />}
      {tab === "produtos" && <RelatoriosProdutosTab />}
    </div>
  );
}

function RelatoriosHistoricoTab() {
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
      const [userId, setUserId] = useState<string>("all");

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  async function load(next?: { startDate?: string; endDate?: string; userId?: string }) {
    const params = new URLSearchParams();
    const start = next?.startDate ?? startDate;
    const end = next?.endDate ?? endDate;
    const waiter = next?.userId ?? userId;
    if (start) params.append("startDate", start);
    if (end) params.append("endDate", end);
    if (waiter !== "all") params.append("userId", waiter);

    try {
      const res = await authFetch(`/api/sales/history?${params}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setSummary(data.summary || {});
      setTopItems(data.topItems || []);
    } catch (e) {
      console.error(e);
      setOrders([]);
      setSummary(null);
      setTopItems([]);
    }
  }

  useEffect(() => {
    authFetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data || []))
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    load();
  }, []);

  function applyPreset(preset: "today" | "week" | "lastWeek" | "month" | "lastMonth") {
    const range = getPresetRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
    load({ startDate: range.start, endDate: range.end });
  }

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
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="select">
            <option value="all">Todos</option>
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

      <div className="row section">
        <button onClick={() => applyPreset("today")} className="btn btn-ghost">
          Hoje
        </button>
        <button onClick={() => applyPreset("week")} className="btn btn-ghost">
          Semana
        </button>
        <button onClick={() => applyPreset("lastWeek")} className="btn btn-ghost">
          Semana passada
        </button>
        <button onClick={() => applyPreset("month")} className="btn btn-ghost">
          Mês atual
        </button>
        <button onClick={() => applyPreset("lastMonth")} className="btn btn-ghost">
          Mês passado
        </button>
      </div>

      <button onClick={() => load()} className="btn btn-primary">
        Pesquisar
      </button>

      {summary && (
        <div className="grid grid-auto section">
          <div className="card">
            <div className="label">Total de pedidos</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{summary.totalOrders}</div>
          </div>
          <div className="card">
            <div className="label">Faturamento</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>R$ {money(summary.totalRevenue)}</div>
          </div>
          <div className="card">
            <div className="label">Ticket médio</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>R$ {money(summary.averageTicket)}</div>
          </div>
          <div className="card">
            <div className="label">Total serviço</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>R$ {money(summary.totalService)}</div>
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
        <h3>Histórico detalhado</h3>
        {orders && orders.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Data/Hora</th>
                  <th>Garçom</th>
                  <th>Mesa</th>
                  <th>Itens</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="muted">{order.code || "-"}</td>
                    <td>{order.closedAt ? new Date(order.closedAt).toLocaleString("pt-BR") : "-"}</td>
                    <td>{order.user?.name || "-"}</td>
                    <td>{order.table?.name || "-"}</td>
                    <td>{order.items?.map((item: any) => `${item.qty}x ${item.product?.name}`).join(", ") || "-"}</td>
                    <td style={{ textAlign: "right" }}>R$ {money(order.totalCents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nenhum pedido encontrado neste período</p>
        )}
      </div>
    </div>
  );
}

function RelatoriosProdutosTab() {
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

  async function load(next?: { startDate?: string; endDate?: string }) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const start = next?.startDate ?? startDate;
      const end = next?.endDate ?? endDate;
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      const res = await authFetch(`/api/sales/history?${params}`);
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

  function applyPreset(preset: "today" | "week" | "lastWeek" | "month" | "lastMonth") {
    const range = getPresetRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
    load({ startDate: range.start, endDate: range.end });
  }

  const totalQty = items.reduce((acc: number, item: any) => acc + (item.qty || 0), 0);

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

      <button onClick={() => load()} className="btn btn-primary">
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
                <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{summary.totalOrders}</div>
              </div>
              <div className="card">
                <div className="label">Quantidade vendida</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{totalQty}</div>
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

function ClosedOrdersSection() {
  const [orders, setOrders] = useState<any[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/orders", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      const closedOrders = Array.isArray(data) ? data.filter((o: any) => o.status === "CLOSED") : [];
      closedOrders.sort((a: any, b: any) => {
        const aDate = a.closedAt ? new Date(a.closedAt).getTime() : 0;
        const bDate = b.closedAt ? new Date(b.closedAt).getTime() : 0;
        return bDate - aDate;
      });
      setOrders(closedOrders);
    } catch (e: any) {
      setOrders([]);
      setError(e?.message || "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function money(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  function openReceipt(orderId: string) {
    window.open(`/print/order?orderId=${orderId}`, "_blank");
  }

  return (
    <div>
      <h2 className="page-title">Pedidos fechados</h2>
      <p className="page-subtitle">Historico do caixa com acesso aos cupons.</p>

      <div className="row section">
        <button onClick={() => setView("grid")} className={`btn ${view === "grid" ? "btn-primary" : "btn-ghost"}`}>
          Grid
        </button>
        <button onClick={() => setView("list")} className={`btn ${view === "list" ? "btn-primary" : "btn-ghost"}`}>
          Lista
        </button>
        <button onClick={() => load()} className="btn btn-ghost">
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className="muted">Carregando pedidos...</p>
      ) : error ? (
        <div className="card card-soft">{error}</div>
      ) : orders.length === 0 ? (
        <div className="status-note">Sem pedidos fechados!</div>
      ) : view === "grid" ? (
        <div className="grid grid-auto section">
          {orders.map((order) => {
            const canceledItems = (order.items || []).filter((it: any) => it.canceledAt);
            return (
              <div key={order.id} className="card">
              <div className="row-between">
                <div>
                  <h3 style={{ margin: 0 }}>{order.table?.name || "Mesa"}</h3>
                  {order.code ? <div className="muted">Codigo: {order.code}</div> : null}
                </div>
                <span className="badge badge-success">Fechado</span>
              </div>

              <div className="card section">
                <div className="row-between">
                  <span>Total</span>
                  <strong>R$ {money(order.totalCents || 0)}</strong>
                </div>
                <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  {order.items?.length || 0} item(ns)
                </div>
                {order.closedAt && (
                  <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                    Fechado em {new Date(order.closedAt).toLocaleString("pt-BR")}
                  </div>
                )}
                {canceledItems.length > 0 ? (
                  <div className="card card-soft" style={{ marginTop: 12 }}>
                    <strong>Itens cancelados</strong>
                    <div className="stack" style={{ marginTop: 8 }}>
                      {canceledItems.map((item: any) => (
                        <div key={item.id} className="muted">
                          {item.qty}x {item.product?.name || "Item"}{item.canceledReason ? ` - ${item.canceledReason}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="row">
                <button onClick={() => openReceipt(order.id)} className="btn btn-secondary">
                  Ver cupom
                </button>
                <button onClick={() => openReceipt(order.id)} className="btn btn-ghost">
                  Baixar PDF
                </button>
              </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="stack section">
          {orders.map((order) => {
            const canceledItems = (order.items || []).filter((it: any) => it.canceledAt);
            return (
              <div key={order.id} className="card list-item">
              <div>
                <strong>{order.table?.name || "Mesa"}</strong>
                <div className="muted">
                  {order.code ? `Codigo ${order.code} ` : ""}
                  {order.closedAt ? `- ${new Date(order.closedAt).toLocaleString("pt-BR")}` : ""}
                </div>
                <div className="muted">{order.items?.length || 0} item(ns)</div>
                {canceledItems.length > 0 ? (
                  <div className="muted">Cancelados: {canceledItems.length}</div>
                ) : null}
              </div>
              <div className="row">
                <strong>R$ {money(order.totalCents || 0)}</strong>
                <button onClick={() => openReceipt(order.id)} className="btn btn-secondary">
                  Cupom
                </button>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    priceCents: 0,
    imageUrl: "",
    categoryId: "",
    stockQty: 0,
    stockMin: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/products");
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    authFetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(formData.imageUrl || "");
  }, [imageFile, formData.imageUrl]);

  async function uploadImage(file: File) {
    const data = new FormData();
    data.append("file", file);
    const res = await authFetch("/api/products/upload", {
      method: "POST",
      body: data,
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const payload = await res.json();
    return String(payload.url || "");
  }

  const handleSave = async () => {
    if (!formData.name || formData.priceCents <= 0) {
      alert("Preencha todos os campos corretamente");
      return;
    }

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      let imageUrl = formData.imageUrl.trim();

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl, categoryId: formData.categoryId || null }),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        priceCents: 0,
        imageUrl: "",
        categoryId: "",
        stockQty: 0,
        stockMin: 0,
      });
      setImageFile(null);
      await loadProducts();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar produto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;

    try {
      const res = await authFetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadProducts();
      } else {
        alert("Erro ao deletar produto");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao deletar produto");
    }
  };

  return (
    <div>
      <div className="row-between section">
        <div>
          <h2 className="page-title">Produtos</h2>
          <p className="page-subtitle">Cadastre e atualize o cardápio.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: "", priceCents: 0, imageUrl: "", categoryId: "", stockQty: 0, stockMin: 0 });
            setImageFile(null);
          }}
          className="btn btn-success"
        >
          Novo produto
        </button>
      </div>

      {showForm && (
        <div className="card section stack">
          <div className="field">
            <label className="label">Nome do produto</label>
            <input
              type="text"
              placeholder="Ex: X-burger"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Categoria</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="select"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Imagem (URL)</label>
            <input
              type="text"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Upload de imagem</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="input"
            />
          </div>
          {imagePreview ? (
            <div className="row">
              <img src={imagePreview} alt="Preview" className="image-preview" />
            </div>
          ) : null}
          <div className="field">
            <label className="label">Preço (centavos)</label>
            <input
              type="number"
              placeholder="Ex: 1290"
              value={formData.priceCents}
              onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) || 0 })}
              className="input"
            />
          </div>
          <div className="grid grid-tight">
            <div className="field">
              <label className="label">Estoque</label>
              <input
                type="number"
                value={formData.stockQty}
                onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div className="field">
              <label className="label">Estoque mínimo</label>
              <input
                type="number"
                value={formData.stockMin}
                onChange={(e) => setFormData({ ...formData, stockMin: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
          </div>
          <div className="row">
            <button onClick={handleSave} className="btn btn-primary">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : (
        <div className="stack">
          {products.map((p) =>
            editingId === p.id ? (
              <div key={p.id} className="card stack">
                <div className="field">
                  <label className="label">Nome do produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="label">Categoria</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="select"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Imagem (URL)</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="label">Upload de imagem</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="input"
                  />
                </div>
                {imagePreview ? (
                  <div className="row">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  </div>
                ) : null}
                <div className="field">
                  <label className="label">Preço (centavos)</label>
                  <input
                    type="number"
                    value={formData.priceCents}
                    onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div className="grid grid-tight">
                  <div className="field">
                    <label className="label">Estoque</label>
                    <input
                      type="number"
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                  <div className="field">
                    <label className="label">Estoque mínimo</label>
                    <input
                      type="number"
                      value={formData.stockMin}
                      onChange={(e) => setFormData({ ...formData, stockMin: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="row">
                  <button onClick={handleSave} className="btn btn-primary">
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
        setFormData({ name: "", priceCents: 0, imageUrl: "", categoryId: "", stockQty: 0, stockMin: 0 });
                      setImageFile(null);
                      setShowForm(false);
                    }}
                    className="btn btn-ghost"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div key={p.id} className="card list-item">
                <div className="row" style={{ flex: 1 }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="product-thumb" />
                  ) : (
                    <div className="product-thumb" />
                  )}
                  <div>
                    <strong>{p.name}</strong>
                    {p.code ? <div className="muted">Código: {p.code}</div> : null}
                    {p.category?.name ? <div className="muted">Categoria: {p.category.name}</div> : null}
                    <div className="muted">R$ {(p.priceCents / 100).toFixed(2).replace(".", ",")}</div>
                    <div className="muted">Estoque: {p.stockQty ?? 0} (mín: {p.stockMin ?? 0})</div>
                  </div>
                </div>
                <div className="row">
                  <button
                  onClick={() => {
                    setEditingId(p.id);
                    setFormData({
                      name: p.name,
                      priceCents: p.priceCents,
                      imageUrl: p.imageUrl || "",
                      categoryId: p.categoryId || "",
                      stockQty: p.stockQty || 0,
                      stockMin: p.stockMin || 0,
                    });
                    setImageFile(null);
                    setShowForm(false);
                  }}
                    className="btn btn-warning"
                  >
                    Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger">
                    Deletar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function CategoriesSection() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) =>
              String(a.name).localeCompare(String(b.name), "pt-BR", { numeric: true, sensitivity: "base" })
            )
          : data;
        setCategories(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Nome e obrigatorio");
      return;
    }

    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name.trim() }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "" });
        await loadCategories();
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar categoria");
    }
  };

  return (
    <div>
      <div className="row-between section">
        <div>
          <h2 className="page-title">Categorias</h2>
          <p className="page-subtitle">Organize os produtos por tipo.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({ name: "" });
          }}
          className="btn btn-success"
        >
          Nova categoria
        </button>
      </div>

      {showForm && (
        <div className="card section stack">
          <div className="field">
            <label className="label">Nome da categoria</label>
            <input
              type="text"
              placeholder="Ex: Bebidas"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="input"
            />
          </div>
          <div className="row">
            <button onClick={handleSave} className="btn btn-primary">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : (
        <div className="grid grid-five">
          {categories.map((c) => (
            <div key={c.id} className="card table-card stack">
              {editingId === c.id ? (
                <>
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="input" />
                  <div className="row">
                    <button
                      onClick={async () => {
                        const name = editingName.trim();
                        if (!name) return;
                        try {
                          const res = await authFetch(`/api/categories/${c.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name }),
                          });
                          if (res.ok) {
                            setEditingId(null);
                            setEditingName("");
                            await loadCategories();
                          }
                        } catch (e) {
                          console.error(e);
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
                  <strong>{c.name}</strong>
                  <div className="row">
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingName(c.name);
                      }}
                      className="btn btn-warning"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Tem certeza?")) return;
                        try {
                          const res = await authFetch(`/api/categories/${c.id}`, { method: "DELETE" });
                          if (res.ok) {
                            await loadCategories();
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="btn btn-danger"
                    >
                      Deletar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanySettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    logoUrl: "",
  });

  const loadCompany = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/company");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data?.name || "",
          phone: data?.phone || "",
          email: data?.email || "",
          address: data?.address || "",
          logoUrl: data?.logoUrl || "",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await authFetch("/api/products/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar imagem");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Nome da empresa é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          logoUrl: formData.logoUrl.trim(),
        }),
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      await loadCompany();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("company-updated"));
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="row-between section">
        <div>
          <h2 className="page-title">Configuração da empresa</h2>
          <p className="page-subtitle">Atualize as informações e a identidade visual.</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : (
        <div className="card section stack">
          <div className="field">
            <label className="label">Nome da empresa</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-tight">
            <div className="field">
              <label className="label">Telefone</label>
              <input
                type="text"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label className="label">Endereço</label>
            <input
              type="text"
              className="input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Logo</label>
            <div className="row">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
              />
              {formData.logoUrl ? (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: "" })}
                  className="btn btn-ghost"
                >
                  Remover logo
                </button>
              ) : null}
            </div>
            {formData.logoUrl ? (
              <div style={{ marginTop: 12 }}>
                <img src={formData.logoUrl} alt="Logo da empresa" style={{ maxHeight: 80 }} />
              </div>
            ) : null}
          </div>
          <div className="row">
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={loadCompany} className="btn btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TablesSection() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/tables");
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) =>
              String(a.name).localeCompare(String(b.name), "pt-BR", { numeric: true, sensitivity: "base" })
            )
          : data;
        setTables(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleSave = async () => {
    if (!formData.name) {
      alert("Nome e obrigatorio");
      return;
    }

    try {
      const res = await authFetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "" });
        await loadTables();
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar mesa");
    }
  };

  return (
    <div>
      <div className="row-between section">
        <div>
          <h2 className="page-title">Mesas</h2>
          <p className="page-subtitle">Gerencie as mesas ativas.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({ name: "" });
          }}
          className="btn btn-success"
        >
          Nova mesa
        </button>
      </div>

      {showForm && (
        <div className="card section stack">
          <div className="field">
            <label className="label">Nome da mesa</label>
            <input
              type="text"
              placeholder="Ex: Mesa 12"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="input"
            />
          </div>
          <div className="row">
            <button onClick={handleSave} className="btn btn-primary">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : (
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
                        const name = editingName.trim();
                        if (!name) return;
                        try {
                          const res = await authFetch(`/api/tables/${t.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name }),
                          });
                          if (res.ok) {
                            setEditingId(null);
                            setEditingName("");
                            await loadTables();
                          }
                        } catch (e) {
                          console.error(e);
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
                  <div className="row">
                    <button
                      onClick={() => {
                        setEditingId(t.id);
                        setEditingName(t.name);
                      }}
                      className="btn btn-warning"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Tem certeza?")) return;
                        try {
                          const res = await authFetch(`/api/tables/${t.id}`, { method: "DELETE" });
                          if (res.ok) {
                            await loadTables();
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="btn btn-danger"
                    >
                      Deletar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", pin: "", role: "GARCOM" });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.pin || !formData.username) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      setShowForm(false);
      setFormData({ name: "", username: "", pin: "", role: "GARCOM" });
      await loadUsers();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar usuario");
    }
  };

  const roleLabels = { ADMIN: "Admin", GARCOM: "Garçom", COZINHA: "Cozinha", CAIXA: "Caixa" };

  return (
    <div>
      <div className="row-between section">
        <div>
        <h2 className="page-title">Usuários</h2>
        <p className="page-subtitle">Controle de acesso por função.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({ name: "", username: "", pin: "", role: "GARCOM" });
          }}
          className="btn btn-success"
        >
          Novo usuário
        </button>
      </div>

      {showForm && (
        <div className="card section stack">
          <div className="field">
            <label className="label">Nome</label>
            <input
              type="text"
              placeholder="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Usuário</label>
            <input
              type="text"
              placeholder="Ex: joao"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">PIN (4 dígitos)</label>
            <input
              type="text"
              placeholder="PIN"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Perfil</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="select"
            >
              <option value="GARCOM">Garçom</option>
              <option value="COZINHA">Cozinha</option>
              <option value="CAIXA">Caixa</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="row">
            <button onClick={handleSave} className="btn btn-primary">
              Salvar
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : (
        <div className="stack">
          {users.map((u) => (
            <div key={u.id} className="card list-item">
              <div>
                <strong>{u.name}</strong>
                <div className="muted">
                  PIN: {u.pin} - {roleLabels[u.role as keyof typeof roleLabels]}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm("Tem certeza?")) return;
                  try {
                    const res = await authFetch(`/api/users/${u.id}`, { method: "DELETE" });
                    if (res.ok) {
                      await loadUsers();
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="btn btn-danger"
              >
                Deletar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}










