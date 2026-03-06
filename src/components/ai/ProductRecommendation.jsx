import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useResponsive from "../../hooks/useResponsive";
import PRODUCTS from "../../products";

function getRecommendations(currentProduct, viewedCategories, maxItems = 6) {
  let candidates = PRODUCTS.filter(p => p.id !== currentProduct?.id);

  if (currentProduct) {
    // Score based on similarity
    candidates = candidates.map(p => {
      let score = 0;
      if (p.category === currentProduct.category) score += 30;
      if (p.brand === currentProduct.brand) score += 20;
      if (p.subcategory === currentProduct.subcategory) score += 15;
      // Price proximity (within 50%)
      if (currentProduct.price && p.price) {
        const ratio = p.price / currentProduct.price;
        if (ratio > 0.5 && ratio < 1.5) score += 10;
      }
      // Power proximity
      if (currentProduct.powerKw && p.powerKw) {
        const diff = Math.abs(p.powerKw - currentProduct.powerKw) / currentProduct.powerKw;
        if (diff < 0.3) score += 10;
      }
      return { ...p, score };
    });

    candidates.sort((a, b) => b.score - a.score);
  } else if (viewedCategories && viewedCategories.length) {
    // Based on viewed categories
    candidates = candidates.map(p => {
      let score = viewedCategories.includes(p.category) ? 20 : 0;
      score += (p.stock || 0) > 10 ? 5 : 0;
      return { ...p, score };
    });
    candidates.sort((a, b) => b.score - a.score);
  } else {
    // Best sellers fallback — most stock + variety of categories
    const seen = new Set();
    candidates = candidates
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .filter(p => {
        if (seen.has(p.category)) return false;
        seen.add(p.category);
        return true;
      });
    // Fill remaining with top stock items
    const extras = PRODUCTS
      .filter(p => p.id !== currentProduct?.id && !candidates.find(c => c.id === p.id))
      .sort((a, b) => (b.stock || 0) - (a.stock || 0));
    candidates = [...candidates, ...extras];
  }

  return candidates.slice(0, maxItems);
}

export default function ProductRecommendation({ currentProduct, title, lang = "fr" }) {
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();

  const recommendations = useMemo(
    () => getRecommendations(currentProduct, null, 6),
    [currentProduct?.id]
  );

  if (recommendations.length === 0) return null;

  const cols = isMobile ? "1fr 1fr" : isTablet ? "repeat(3, 1fr)" : "repeat(4, 1fr)";
  const displayTitle = title || (lang === "fr" ? "Vous pourriez aussi aimer" : "You might also like");

  return (
    <section style={{ padding: isMobile ? "24px 16px" : "40px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ width: 32, height: 3, background: "#E8700A", borderRadius: 2 }} />
        <h2 style={{
          fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#1e293b",
          fontFamily: "'DM Sans', sans-serif", margin: 0,
        }}>
          {displayTitle}
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 10 : 16 }}>
        {recommendations.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/product/${p.id}`)}
            className="hl"
            style={{
              borderRadius: 10, border: "1px solid #e4e5ec", background: "#fff",
              overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {/* Stock badge */}
            <div style={{ padding: "8px 12px 0" }}>
              <span style={{ fontSize: 11, color: (p.stock || 0) > 10 ? "#10b981" : "#f59e0b", fontWeight: 500 }}>
                {"● " + (p.stock || 0).toLocaleString() + " pcs"}
              </span>
            </div>

            {/* Image */}
            <div style={{
              height: isMobile ? 90 : 120, display: "flex", alignItems: "center",
              justifyContent: "center", padding: isMobile ? 10 : 16,
            }}>
              <img
                src={p.image}
                alt={p.name}
                style={{ maxHeight: isMobile ? 70 : 100, maxWidth: "100%", objectFit: "contain" }}
                onError={(e) => { e.target.onerror = null; e.target.style.opacity = "0.2"; }}
              />
            </div>

            {/* Info */}
            <div style={{ padding: isMobile ? "8px 10px 12px" : "10px 14px 14px", flex: 1 }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>
                {p.brand}
              </div>
              <div style={{
                fontSize: isMobile ? 11 : 13, fontWeight: 600, color: "#1e293b",
                lineHeight: 1.3, marginBottom: 6,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {p.name}
              </div>
              {p.power && (
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {p.power} {p.phases ? `· ${p.phases}P` : ""}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
