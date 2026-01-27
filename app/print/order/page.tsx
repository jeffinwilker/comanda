"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useAuth } from "@/app/auth-context";

function PrintOrderContent() {
  const { getCompanyHeaders } = useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`, { headers: getCompanyHeaders() });
        const data = await res.json();
        setOrder(data);
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId, getCompanyHeaders]);

  if (loading) return <div className="page page-narrow">Carregando cupom...</div>;
  if (!order) return <div className="page page-narrow">Pedido não encontrado</div>;

  const subtotal = order.items
    .filter((it: any) => !it.canceledAt)
    .reduce((acc: number, it: any) => acc + it.qty * it.product.priceCents, 0);
  const service = order.serviceEnabled ? Math.round(subtotal * (order.serviceRateBps / 10000)) : 0;
  const total = subtotal + service;
  const money = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  const downloadPDF = async () => {
    const element = document.getElementById("cupom");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [58, 200],
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 58, (canvas.height * 58) / canvas.width);
      pdf.save(`cupom-mesa-${order.table.name}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF");
    }
  };

  const sendToThermalPrinter = async () => {
    const element = document.getElementById("cupom");
    if (!element) return;

    try {
      const printWindow = window.open("", "", "height=400,width=600");
      if (printWindow) {
        printWindow.document.write(element.innerHTML);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      alert("Erro ao enviar para impressora");
    }
  };

  return (
    <div className="page page-narrow">
      <div id="cupom" className="receipt">
        <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: 8 }}>RESTAURANTE</div>
        <div style={{ textAlign: "center", fontSize: "11px", marginBottom: 8 }}>
          Mesa: {order.table.name}
          {order.code ? (
            <>
              <br />
              Código: {order.code}
            </>
          ) : null}
          <br />
          {new Date(order.closedAt ?? order.createdAt).toLocaleString("pt-BR")}
        </div>

        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", margin: "8px 0", padding: "8px 0" }}>
          {order.items
            .filter((it: any) => !it.canceledAt)
            .map((it: any) => (
              <div key={it.id} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <span>
                    {it.qty}x {it.product.name}
                  </span>
                  <span>R$ {money(it.qty * it.product.priceCents)}</span>
                </div>
                {it.note ? <div style={{ fontSize: "11px", color: "#666" }}>{it.note}</div> : null}
              </div>
            ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>Subtotal</span>
          <span>R$ {money(subtotal)}</span>
        </div>

        {order.serviceEnabled ? (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "11px" }}>
            <span>Serviço (10%)</span>
            <span>R$ {money(service)}</span>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", borderTop: "1px dashed #000", paddingTop: 8 }}>
          <span>TOTAL</span>
          <span>R$ {money(total)}</span>
        </div>

        {order.paymentMethod && (
          <div style={{ textAlign: "center", fontSize: "11px", marginTop: 8, color: "#666" }}>
            Pagamento: {order.paymentMethod}
          </div>
        )}
      </div>

      <div className="receipt-actions">
        <button onClick={downloadPDF} className="btn btn-secondary">
          Download PDF
        </button>
        <button onClick={sendToThermalPrinter} className="btn btn-success">
          Imprimir
        </button>
      </div>
    </div>
  );
}

export default function PrintOrder() {
  return (
    <Suspense fallback={<div className="page page-narrow">Carregando cupom...</div>}>
      <PrintOrderContent />
    </Suspense>
  );
}
