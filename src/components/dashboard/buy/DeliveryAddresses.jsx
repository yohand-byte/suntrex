import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

const MOCK_ADDRESSES = [
  { id: 1, label: "Siege social", name: "SolarPro France", street: "45 Avenue de la Republique", city: "Paris", zip: "75011", country: "FR", phone: "+33 1 42 00 00 00", isDefault: true },
  { id: 2, label: "Entrepot Sud", name: "SolarPro France", street: "12 Zone Industrielle", city: "Marseille", zip: "13015", country: "FR", phone: "+33 4 91 00 00 00", isDefault: false },
];

const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };

export default function DeliveryAddresses() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [addresses] = useState(MOCK_ADDRESSES);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
          {lang === "fr" ? "Adresses de livraison" : "Delivery addresses"}
        </h1>
        <button style={{
          background: T.accent, color: "#fff",
          border: "none", borderRadius: T.radiusSm,
          padding: "8px 16px", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font, minHeight: 40,
        }}>
          {lang === "fr" ? "+ Ajouter" : "+ Add"}
        </button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={"\uD83D\uDCCD"}
          title={lang === "fr" ? "Aucune adresse enregistree" : "No addresses saved"}
          description={lang === "fr" ? "Ajoutez une adresse de livraison pour vos commandes." : "Add a delivery address for your orders."}
          actionLabel={lang === "fr" ? "Ajouter une adresse" : "Add address"}
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
        }}>
          {addresses.map((addr) => (
            <div key={addr.id} style={{
              background: T.card,
              borderRadius: T.radius,
              border: `1px solid ${addr.isDefault ? T.accent : T.border}`,
              padding: 20,
              position: "relative",
            }}>
              {addr.isDefault && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  background: T.accentLight, color: T.accent,
                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 4,
                }}>
                  {lang === "fr" ? "PAR DEFAUT" : "DEFAULT"}
                </span>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 4 }}>
                {addr.label}
              </div>
              <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, lineHeight: 1.6 }}>
                <div>{addr.name}</div>
                <div>{addr.street}</div>
                <div>{addr.zip} {addr.city}</div>
                <div>{FLAG_EMOJI[addr.country] || ""} {addr.country}</div>
                {addr.phone && <div style={{ marginTop: 4 }}>{"\u260E\uFE0F"} {addr.phone}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.textSec, cursor: "pointer", fontFamily: T.font }}>
                  {lang === "fr" ? "Modifier" : "Edit"}
                </button>
                {!addr.isDefault && (
                  <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.accent, cursor: "pointer", fontFamily: T.font }}>
                    {lang === "fr" ? "Par defaut" : "Set default"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
