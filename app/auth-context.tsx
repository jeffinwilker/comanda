"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UserRole = "ADMIN" | "GARCOM" | "COZINHA" | "CAIXA";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (companyCode: string, username: string, pin: string) => Promise<void>;
  logout: () => void;
  getCompanyHeaders: (extra?: HeadersInit) => HeadersInit;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (companyCode: string, username: string, pin: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, companyCode, username }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Credenciais invalidas");
      }

      const userData = await res.json();
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  const getCompanyHeaders = (extra: HeadersInit = {}) => {
    const headers = new Headers(extra);
    if (user?.companyId) headers.set("x-company-id", user.companyId);
    return headers;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getCompanyHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
