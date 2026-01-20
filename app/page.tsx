"use client";

import { useAuth } from "./auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Redirecionando</h1>
      <p className="page-subtitle">Aguardando definição de acesso.</p>
    </div>
  );
}
