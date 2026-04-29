import { useEffect, useState } from "react";
import { subscribeConnection, wakeUp } from "../services/api";

/**
 * Visible banner at the top of the page indicating backend connection status.
 * - "connecting": shown while the server is being woken up (Render cold start)
 * - "offline":    shown when API calls are failing
 * - "online" / "unknown": no banner
 */
export default function ConnectionBanner() {
  const [status, setStatus] = useState("unknown");

  useEffect(() => {
    const unsub = subscribeConnection(setStatus);
    return unsub;
  }, []);

  const retry = () => { wakeUp(); };

  if (status === "online" || status === "unknown") return null;

  const isConnecting = status === "connecting";

  return (
    <div
      data-testid="connection-banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontSize: 13,
        fontWeight: 600,
        color: "#fff",
        backgroundColor: isConnecting ? "#b45309" : "#b91c1c",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      <span>
        {isConnecting
          ? "Conectando ao servidor… (pode demorar até 60 segundos no primeiro acesso)"
          : "Sem conexão com o servidor — os dados não estão sincronizando."}
      </span>
      {!isConnecting && (
        <button
          onClick={retry}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.5)",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
