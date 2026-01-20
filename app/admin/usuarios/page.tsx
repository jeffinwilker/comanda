"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/navbar";
import { ProtectedRoute } from "@/app/protected-route";

function UsuariosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="page page-narrow">
        <h1 className="page-title">Redirecionando</h1>
        <p className="page-subtitle">Abrindo painel de administração.</p>
      </main>
    </>
  );
}

export default function AdminUsuariosPage() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <UsuariosRedirect />
    </ProtectedRoute>
  );
}
