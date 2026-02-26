import React, { useState, useMemo } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";
import { MOCK_SELLER } from "../dashboardUtils";

const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const STATUS_CONFIG = {
  active:  { label: "Active",   labelFr: "Active",   color: T.greenText, bg: T.greenBg },
  paused:  { label: "Paused",   labelFr: "En pause", color: T.yellowText, bg: T.yellowBg },
  soldout: { label: "Sold out", labelFr: "Epuise",   color: T.redText,   bg: T.redBg },
};

export default function ManageOffers() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);

  const listings = MOCK_SELLER.listings;

  const filtered = useMemo(() => {
    let result = listings;
    if (filter !== "all") result = result.filter(l => l.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q));
    }
    return result;
  }, [filter, searchQuery, listings]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
          {lang === "fr" ? "Gerer les offres" : "Manage offers"}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, minHeight: 40 }}>
            {lang === "fr" ? "+ Nouvelle annonce" : "+ New listing"}
          </button>
          <button style={{ background: T.card, color: T.textSec, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, minHeight: 40 }}>
            {lang === "fr" ? "Import XLSX" : "Import XLSX"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: isMobile ? "100%" : 260 }}>
          <input type="text" placeholder={lang === "fr" ? "Rechercher un produit..." : "Search product..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 34px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, fontFamily: T.font, color: T.text, background: T.card, outline: "none" }} />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textMuted, pointerEvents: "none" }}>{"\uD83D\uDD0D"}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "all", label: "All", labelFr: "Tout" },
            { id: "active", label: "Active", labelFr: "Actives" },
            { id: "paused", label: "Paused", labelFr: "En pause" },
            { id: "soldout", label: "Sold out", labelFr: "Epuisees" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
              background: filter === tab.id ? T.text : T.card,
              color: filter === tab.id ? "#fff" : T.textSec,
              border: filter === tab.id ? "none" : `1px solid ${T.border}`,
              borderRadius: 99, padding: "6px 12px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: T.font, minHeight: 34,
            }}>
              {lang === "fr" ? tab.labelFr : tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={"\uD83D\uDCCB"} title={lang === "fr" ? "Aucune offre" : "No offers"} description={lang === "fr" ? "Creez votre premiere annonce." : "Create your first listing."} />
      ) : (
        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {/* Table header (desktop only) */}
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 80px 80px", gap: 12, padding: "10px 20px", background: T.bg, fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: T.font, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>{lang === "fr" ? "Produit" : "Product"}</span>
              <span>{lang === "fr" ? "Prix" : "Price"}</span>
              <span>Stock</span>
              <span>{lang === "fr" ? "Vues" : "Views"}</span>
              <span>{lang === "fr" ? "Ventes" : "Sales"}</span>
              <span>Status</span>
            </div>
          )}
          {filtered.map((listing, idx) => (
            <div key={listing.id}
              onMouseEnter={() => setHoveredRow(listing.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: isMobile ? "flex" : "grid",
                gridTemplateColumns: isMobile ? undefined : "2fr 1fr 80px 80px 80px 80px",
                flexDirection: isMobile ? "column" : undefined,
                gap: isMobile ? 6 : 12,
                alignItems: isMobile ? "flex-start" : "center",
                padding: isMobile ? 14 : "12px 20px",
                borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
                background: hoveredRow === listing.id ? T.bg : "transparent",
                transition: T.transitionFast,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{listing.name}</div>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>{listing.sku}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{formatPrice(listing.price)}</div>
              <div style={{ fontSize: 13, color: listing.stock === 0 ? T.red : T.text, fontWeight: listing.stock === 0 ? 600 : 400, fontFamily: T.font }}>{listing.stock}</div>
              {!isMobile && <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{listing.views}</div>}
              {!isMobile && <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{listing.orders}</div>}
              <div>
                {STATUS_CONFIG[listing.status] && (
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px", borderRadius: 99,
                    fontSize: 11, fontWeight: 600, fontFamily: T.font,
                    color: STATUS_CONFIG[listing.status].color,
                    background: STATUS_CONFIG[listing.status].bg,
                  }}>
                    {lang === "fr" ? STATUS_CONFIG[listing.status].labelFr : STATUS_CONFIG[listing.status].label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
