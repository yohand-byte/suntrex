import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

const MOCK_WAREHOUSES = [
  { id: 1, name: "Munich Central", address: "Industriestr. 42, 80339 Munchen", country: "DE", products: 32, capacity: "85%", isActive: true },
  { id: 2, name: "Rotterdam Port", address: "Europaweg 123, 3199 LC Rotterdam", country: "NL", products: 15, capacity: "45%", isActive: true },
];

const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };

export default function WarehouseManager() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [warehouses] = useState(MOCK_WAREHOUSES);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
          {lang === "fr" ? "Entrepots" : "Warehouses"}
        </h1>
        <button style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, minHeight: 40 }}>
          {lang === "fr" ? "+ Ajouter" : "+ Add"}
        </button>
      </div>

      {warehouses.length === 0 ? (
        <EmptyState icon={"\uD83C\uDFED"} title={lang === "fr" ? "Aucun entrepot" : "No warehouses"} description={lang === "fr" ? "Ajoutez vos entrepots pour gerer vos stocks." : "Add your warehouses to manage stock."} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          {warehouses.map(wh => (
            <div key={wh.id} style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.font }}>{wh.name}</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: wh.isActive ? T.greenBg : T.redBg, color: wh.isActive ? T.greenText : T.redText }}>
                  {wh.isActive ? (lang === "fr" ? "Actif" : "Active") : (lang === "fr" ? "Inactif" : "Inactive")}
                </span>
              </div>
              <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, lineHeight: 1.5, marginBottom: 12 }}>
                <div>{FLAG_EMOJI[wh.country] || ""} {wh.address}</div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, fontFamily: T.font }}>
                <div><span style={{ color: T.textMuted }}>{lang === "fr" ? "Produits:" : "Products:"}</span> <strong style={{ color: T.text }}>{wh.products}</strong></div>
                <div><span style={{ color: T.textMuted }}>{lang === "fr" ? "Capacite:" : "Capacity:"}</span> <strong style={{ color: T.text }}>{wh.capacity}</strong></div>
              </div>
              <button style={{ marginTop: 14, background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.textSec, cursor: "pointer", fontFamily: T.font }}>
                {lang === "fr" ? "Gerer" : "Manage"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
