"use client";

import { useAuth } from "@/app/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Redirecionar para a página correta baseado no role
    const roleRoutes = {
      GARCOM: "/garcom",
      COZINHA: "/cozinha",
      CAIXA: "/caixa",
      ADMIN: "/admin",
    };

    router.push(roleRoutes[user.role as keyof typeof roleRoutes]);
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Carregando</h1>
        <p className="page-subtitle">Preparando sua área.</p>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Redirecionando</h1>
      <p className="page-subtitle">Abrindo seu painel.</p>
    </div>
  );
}

