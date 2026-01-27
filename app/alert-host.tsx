"use client";

import { useEffect, useState } from "react";

type AlertItem = {
  id: number;
  message: string;
  type: "info" | "success" | "warning" | "error";
};

const DEFAULT_DURATION = 3500;

export function AlertHost() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    let idSeed = 0;

    function pushAlert(message: string, type: AlertItem["type"] = "warning", duration = DEFAULT_DURATION) {
      const id = Date.now() + idSeed++;
      setAlerts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setAlerts((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    }

    function handleEvent(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      const message = String(detail.message || "");
      if (!message) return;
      const type = detail.type as AlertItem["type"];
      const duration = typeof detail.duration === "number" ? detail.duration : DEFAULT_DURATION;
      pushAlert(message, type || "warning", duration);
    }

    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      const text = typeof message === "string" ? message : JSON.stringify(message);
      pushAlert(text || "Aviso");
    };

    window.addEventListener("app-alert", handleEvent);

    (window as any).appNotify = (message: string, type?: AlertItem["type"], duration?: number) => {
      pushAlert(message, type, duration);
    };

    return () => {
      window.alert = originalAlert;
      window.removeEventListener("app-alert", handleEvent);
    };
  }, []);

  if (!alerts.length) return null;

  return (
    <div className="app-alert-stack" role="status" aria-live="polite">
      {alerts.map((alert) => (
        <div key={alert.id} className={`app-alert app-alert-${alert.type}`}>
          <span className="app-alert-icon">!</span>
          <span className="app-alert-text">{alert.message}</span>
        </div>
      ))}
    </div>
  );
}
