"use client";

import { useAuth, UserRole } from "@/app/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, loading, requiredRoles, router]);

  if (loading) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Carregando</h1>
        <p className="page-subtitle">Validando suas permissões.</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Acesso negado</h1>
        <p className="page-subtitle">Seu perfil não pode acessar esta área.</p>
      </div>
    );
  }

  return <>{children}</>;
}

