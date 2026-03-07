import { useState } from "react";
import useResponsive from "../../hooks/useResponsive";

var API_BASE = import.meta.env.VITE_API_BASE || "https://suntrex-api-316868455348.europe-west1.run.app";

var CARRIER_ICONS = {
  DPD: { color: "#DC0032", bg: "#fef2f2" },
  GLS: { color: "#004494", bg: "#eff6ff" },
  "DB Schenker": { color: "#F01414", bg: "#fff7ed" },
};

export default function ShippingRates({ orderId, weight, origin, destination, onSelect, lang }) {
  var isFr = (lang || "fr") === "fr";
  var { isMobile } = useResponsive();
  var [rates, setRates] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [selected, setSelected] = useState(null);
  var [booking, setBooking] = useState(null);
  var [bookingLoading, setBookingLoading] = useState(false);

  function fetchRates() {
    setLoading(true);
    setError(null);
    fetch(API_BASE + "/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem("sb-access-token") || "") },
      body: JSON.stringify({ weight: weight || 15, origin: origin || "FR", destination: destination || "DE" }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { setRates(data); setLoading(false); })
      .catch(function () { setError(isFr ? "Erreur de chargement des tarifs" : "Failed to load rates"); setLoading(false); });
  }

  function bookCarrier(carrierName) {
    setBookingLoading(true);
    fetch(API_BASE + "/api/shipping/book", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem("sb-access-token") || "") },
      body: JSON.stringify({ orderId: orderId, carrier: carrierName }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setBooking(data.booking);
        setBookingLoading(false);
        if (onSelect) onSelect(data.booking);
      })
      .catch(function () { setBookingLoading(false); });
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: isMobile ? 16 : 20, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>&#x1F69A;</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>
            {isFr ? "Transporteurs disponibles" : "Available carriers"}
          </span>
        </div>
        {!rates && !loading && (
          <button onClick={fetchRates} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#E8700A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {isFr ? "Voir les tarifs" : "Get rates"}
          </button>
        )}
      </div>

      {loading && (
        <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          {isFr ? "Chargement des tarifs..." : "Loading rates..."}
        </div>
      )}

      {error && (
        <div style={{ padding: 16, background: "#fef2f2", color: "#ef4444", fontSize: 13 }}>{error}</div>
      )}

      {booking && (
        <div style={{ padding: 20, background: "#ecfdf5", borderTop: "1px solid #d1fae5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>&#x2705;</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#065f46" }}>
              {isFr ? "Enlevement reserve !" : "Pickup booked!"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#065f46", lineHeight: 1.6 }}>
            <div><b>{isFr ? "Transporteur" : "Carrier"}:</b> {booking.carrier}</div>
            <div><b>Tracking:</b> {booking.trackingNumber}</div>
            <div><b>{isFr ? "Date enlevement" : "Pickup date"}:</b> {booking.pickupDate}</div>
            <div><b>{isFr ? "Livraison estimee" : "Est. delivery"}:</b> {booking.estimatedDelivery}</div>
          </div>
        </div>
      )}

      {rates && !booking && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 0 }}>
          {rates.carriers.map(function (c) {
            var ci = CARRIER_ICONS[c.name] || { color: "#64748b", bg: "#f8fafc" };
            var isSelected = selected === c.name;
            return (
              <div key={c.name} style={{
                padding: isMobile ? 16 : 20,
                borderRight: isMobile ? "none" : "1px solid #f1f5f9",
                borderBottom: isMobile ? "1px solid #f1f5f9" : "none",
                background: isSelected ? ci.bg : "#fff",
                cursor: c.available ? "pointer" : "default",
                opacity: c.available ? 1 : 0.5,
                transition: "background .15s",
              }} onClick={function () { if (c.available) setSelected(c.name); }}>
                {/* Carrier header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: ci.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: ci.color }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                    {c.available && <div style={{ fontSize: 11, color: "#64748b" }}>{c.estimatedDays} {isFr ? "jours" : "days"}</div>}
                  </div>
                </div>

                {c.available ? (
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: ci.color, marginBottom: 4 }}>
                      {c.price.toFixed(2)} <span style={{ fontSize: 13, fontWeight: 400 }}>EUR</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>
                      Max {c.maxWeight} kg
                    </div>
                    {isSelected && (
                      <button
                        onClick={function (e) { e.stopPropagation(); bookCarrier(c.name); }}
                        disabled={bookingLoading}
                        style={{
                          width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                          background: bookingLoading ? "#94a3b8" : "#E8700A", color: "#fff",
                          fontSize: 13, fontWeight: 600, cursor: bookingLoading ? "wait" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {bookingLoading ? "..." : (isFr ? "Reserver" : "Book")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#ef4444" }}>{c.reason}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
