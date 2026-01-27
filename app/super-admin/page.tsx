"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SuperAdminUser = { id: string; name: string; username: string };

function getStoredAdmin() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("super_admin");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SuperAdminUser;
  } catch {
    localStorage.removeItem("super_admin");
    return null;
  }
}

function buildAdminHeaders(extra: HeadersInit = {}) {
  const headers = new Headers(extra);
  const admin = getStoredAdmin();
  if (admin?.id) {
    headers.set("x-super-admin-id", admin.id);
  }
  return headers;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<SuperAdminUser | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showProvision, setShowProvision] = useState(false);
  const [provisionCompany, setProvisionCompany] = useState<any | null>(null);
  const [provisionData, setProvisionData] = useState({ adminUsername: "admin", adminPin: "" });
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    dbName: "",
    adminUsername: "admin",
    adminPin: "",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ name: "", code: "", dbName: "", isActive: true });

  useEffect(() => {
    const stored = getStoredAdmin();
    if (!stored) {
      router.push("/super-admin/login");
      return;
    }
    setAdmin(stored);
  }, [router]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies", { headers: buildAdminHeaders() });
      if (res.ok) {
        setCompanies(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) {
      loadCompanies();
    }
  }, [admin]);

  const normalizeCode = (value: string) => value.trim().toLowerCase();

  const handleCreate = async () => {
    const name = formData.name.trim();
    const code = normalizeCode(formData.code);
    const dbName = formData.dbName.trim() ? normalizeCode(formData.dbName) : "";
    const adminUsername = normalizeCode(formData.adminUsername || "");
    const adminPin = formData.adminPin.trim();
    if (!name || !code || !adminUsername || !adminPin) {
      setNotice({ type: "error", message: "Preencha nome, código, usuário e PIN do admin." });
      return;
    }
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: buildAdminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          code,
          dbName,
          adminUsername,
          adminPin,
          isActive: formData.isActive,
        }),
      });
      if (!res.ok) {
        setNotice({ type: "error", message: await res.text() });
        return;
      }
      setShowForm(false);
      setFormData({ name: "", code: "", dbName: "", adminUsername: "admin", adminPin: "", isActive: true });
      await loadCompanies();
      setNotice({ type: "success", message: "Empresa criada com sucesso." });
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", message: "Erro ao criar empresa." });
    }
  };

    const handleUpdate = async (companyId: string, data: { name: string; code: string; dbName: string; isActive: boolean }) => {
    const name = data.name.trim();
    const code = normalizeCode(data.code);
    const dbName = data.dbName.trim() ? normalizeCode(data.dbName) : "";
    if (!name || !code) {
      setNotice({ type: "error", message: "Preencha nome e código." });
      return;
    }
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: buildAdminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name, code, dbName: dbName || undefined, isActive: data.isActive }),
      });
      if (!res.ok) {
        setNotice({ type: "error", message: await res.text() });
        return;
      }
      setEditingId(null);
      setEditingData({ name: "", code: "", dbName: "", isActive: true });
      await loadCompanies();
      setNotice({ type: "success", message: "Empresa atualizada." });
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", message: "Erro ao atualizar empresa." });
    }
  };

  const handleProvision = async (companyId: string, adminUsername: string, adminPin: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/provision`, {
        method: "POST",
        headers: buildAdminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          adminUsername: adminUsername.trim() || undefined,
          adminPin: adminPin.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setNotice({ type: "error", message: await res.text() });
        return;
      }
      setNotice({ type: "success", message: "Banco provisionado com sucesso." });
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", message: "Erro ao provisionar banco." });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("super_admin");
    router.push("/super-admin/login");
  };

  const handleImpersonate = async (companyId: string) => {
    try {
      const res = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        headers: buildAdminHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ companyId }),
      });
      if (!res.ok) {
        setNotice({ type: "error", message: await res.text() });
        return;
      }
      const user = await res.json();
      localStorage.setItem("auth_user", JSON.stringify(user));
      window.open("/dashboard", "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setNotice({ type: "error", message: "Erro ao acessar empresa." });
    }
  };

  if (!admin) return null;

  return (
    <main className="page">
      <div className="row-between section">
        <div>
          <h1 className="page-title">Super Admin</h1>
          <p className="page-subtitle">Gestão global das empresas.</p>
        </div>
        <div className="row">
          <span className="muted">Olá, {admin.name}</span>
          <button onClick={handleLogout} className="btn btn-ghost">
            Sair
          </button>
        </div>
      </div>

      <div className="row-between section">
        <div>
          <h2 className="page-title">Empresas</h2>
          <p className="page-subtitle">Cadastre e gerencie empresas do sistema.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({ name: "", code: "", dbName: "", adminUsername: "admin", adminPin: "", isActive: true });
          }}
          className="btn btn-success"
        >
          Nova empresa
        </button>
      </div>

      {notice ? (
        <div className={`card section ${notice.type === "success" ? "card-soft" : "card-danger"}`}>
          <div className="row-between">
            <span>{notice.message}</span>
            <button className="btn btn-ghost" onClick={() => setNotice(null)}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}

      {showProvision && provisionCompany && (
        <div className="card section stack">
          <h3>Provisionar banco</h3>
          <p className="muted">Empresa: {provisionCompany.name}</p>
          <div className="field">
            <label className="label">Usuário admin (opcional)</label>
            <input
              type="text"
              placeholder="Ex: admin"
              value={provisionData.adminUsername}
              onChange={(e) => setProvisionData({ ...provisionData, adminUsername: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">PIN admin (opcional)</label>
            <input
              type="text"
              placeholder="4 dígitos"
              value={provisionData.adminPin}
              onChange={(e) => setProvisionData({ ...provisionData, adminPin: e.target.value })}
              className="input"
            />
          </div>
          <div className="row">
            <button
              onClick={async () => {
                await handleProvision(provisionCompany.id, provisionData.adminUsername, provisionData.adminPin);
                setShowProvision(false);
                setProvisionCompany(null);
                setProvisionData({ adminUsername: "admin", adminPin: "" });
              }}
              className="btn btn-primary"
            >
              Provisionar
            </button>
            <button
              onClick={() => {
                setShowProvision(false);
                setProvisionCompany(null);
                setProvisionData({ adminUsername: "admin", adminPin: "" });
              }}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card section stack">
          <div className="field">
            <label className="label">Nome</label>
            <input
              type="text"
              placeholder="Ex: Restaurante Central"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Código (login)</label>
            <input
              type="text"
              placeholder="Ex: central"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Banco (opcional)</label>
            <input
              type="text"
              placeholder="Ex: comanda_central"
              value={formData.dbName}
              onChange={(e) => setFormData({ ...formData, dbName: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">Usuário admin</label>
            <input
              type="text"
              placeholder="Ex: admin"
              value={formData.adminUsername}
              onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">PIN admin</label>
            <input
              type="text"
              placeholder="4 dígitos"
              value={formData.adminPin}
              onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
              className="input"
            />
          </div>
          <label className="row">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span>Empresa ativa</span>
          </label>
          <div className="row">
            <button onClick={handleCreate} className="btn btn-primary">
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
          {companies.map((company) => (
            <div key={company.id} className="card table-card stack company-card">
              {editingId === company.id ? (
                <>
                  <input
                    value={editingData.name}
                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                    className="input"
                  />
                  <input
                    value={editingData.code}
                    onChange={(e) => setEditingData({ ...editingData, code: e.target.value })}
                    className="input"
                  />
                  <input
                    value={editingData.dbName}
                    onChange={(e) => setEditingData({ ...editingData, dbName: e.target.value })}
                    className="input"
                  />
                  <label className="row">
                    <input
                      type="checkbox"
                      checked={editingData.isActive}
                      onChange={(e) => setEditingData({ ...editingData, isActive: e.target.checked })}
                    />
                    <span>Ativa</span>
                  </label>
                  <div className="row">
                    <button onClick={() => handleUpdate(company.id, editingData)} className="btn btn-primary">
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingData({ name: "", code: "", dbName: "", isActive: true });
                      }}
                      className="btn btn-ghost"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <strong>{company.name}</strong>
                  <div className="muted">Código: {(company.code || "").toUpperCase()}</div>
                  <div className="muted">
                    Banco: <span className="db-name">{company.dbName}</span>
                  </div>
                  <span className={`badge ${company.isActive ? "badge-success" : "badge-neutral"}`}>
                    {company.isActive ? "Ativa" : "Inativa"}
                  </span>
                  <div className="row">
                    <button
                      onClick={() => {
                        setEditingId(company.id);
                        setEditingData({
                          name: company.name,
                          code: company.code || "",
                          dbName: company.dbName || "",
                          isActive: Boolean(company.isActive),
                        });
                      }}
                      className="btn btn-warning"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleImpersonate(company.id)}
                      className="btn btn-ghost"
                    >
                      Entrar na empresa
                    </button>
                    <button
                      onClick={() => {
                        setProvisionCompany(company);
                        setProvisionData({ adminUsername: "admin", adminPin: "" });
                        setShowProvision(true);
                      }}
                      className="btn btn-ghost"
                    >
                      Provisionar banco
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/companies/${company.id}`, {
                            method: "PATCH",
                            headers: buildAdminHeaders({ "Content-Type": "application/json" }),
                            body: JSON.stringify({ isActive: !company.isActive }),
                          });
                          if (res.ok) {
                            await loadCompanies();
                          }
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      className="btn btn-ghost"
                    >
                      {company.isActive ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
