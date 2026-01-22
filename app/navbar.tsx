"use client";

import { useAuth } from "@/app/auth-context";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="nav">
      <div className="nav-brand">
        <img src="/logo.png" alt="Espetinho do Jardim" className="nav-logo" />
      </div>
      <div className="nav-actions">
        <span className="nav-user">Olá, {user.name}</span>
        <button onClick={handleLogout} className="btn btn-ghost nav-logout">
          Sair
        </button>
      </div>
    </nav>
  );
}
