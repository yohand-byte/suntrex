import { useState, useMemo } from "react";
import useResponsive from "../../hooks/useResponsive";
import useProductsCatalog from "../../hooks/useProductsCatalog";

function getMarketData(products, productName, brand, category) {
  // Find similar products by category + brand
  const similar = products.filter(p =>
    p.category === category || p.brand === brand
  ).filter(p => p.price > 0);

  if (similar.length === 0) return null;

  const prices = similar.map(p => p.price).sort((a, b) => a - b);
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const min = prices[0];
  const max = prices[prices.length - 1];
  const median = prices[Math.floor(prices.length / 2)];

  return { avg, min, max, median, count: similar.length };
}

function getAdvice(sellerPrice, market, lang = "fr") {
  if (!market || !sellerPrice) return null;

  const diff = ((sellerPrice - market.avg) / market.avg * 100).toFixed(0);
  const diffAbs = Math.abs(diff);

  if (diff > 15) {
    return {
      status: "high",
      color: "#ef4444",
      bg: "#fef2f2",
      icon: "📈",
      text: lang === "fr"
        ? `Votre prix est ${diffAbs}% au-dessus de la moyenne. Reduire a ~${Math.round(market.avg * 1.05)}€ augmenterait vos chances de vente de ~${Math.min(40, Math.round(diffAbs * 0.8))}%.`
        : `Your price is ${diffAbs}% above average. Reducing to ~€${Math.round(market.avg * 1.05)} could increase your sales chance by ~${Math.min(40, Math.round(diffAbs * 0.8))}%.`,
    };
  } else if (diff > 5) {
    return {
      status: "slightly_high",
      color: "#f59e0b",
      bg: "#fffbeb",
      icon: "📊",
      text: lang === "fr"
        ? `Votre prix est ${diffAbs}% au-dessus de la moyenne. Competitif mais pas le meilleur.`
        : `Your price is ${diffAbs}% above average. Competitive but not the best.`,
    };
  } else if (diff >= -5) {
    return {
      status: "good",
      color: "#10b981",
      bg: "#ecfdf5",
      icon: "✅",
      text: lang === "fr"
        ? `Excellent ! Votre prix est dans la moyenne du marche. Position optimale.`
        : `Excellent! Your price is at market average. Optimal position.`,
    };
  } else {
    return {
      status: "low",
      color: "#3b82f6",
      bg: "#eff6ff",
      icon: "💡",
      text: lang === "fr"
        ? `Votre prix est ${diffAbs}% en dessous de la moyenne. Vous pourriez augmenter vos marges.`
        : `Your price is ${diffAbs}% below average. You could increase your margins.`,
    };
  }
}

export default function PricingAdvisor({ productName, brand, category, sellerPrice, lang = "fr" }) {
  const { isMobile } = useResponsive();
  const { products } = useProductsCatalog();
  const [expanded, setExpanded] = useState(false);

  const market = useMemo(
    () => getMarketData(products, productName, brand, category),
    [products, productName, brand, category]
  );

  const advice = useMemo(
    () => getAdvice(sellerPrice, market, lang),
    [sellerPrice, market, lang]
  );

  if (!market || !sellerPrice) return null;

  const pad = isMobile ? 16 : 20;

  // Price position bar
  const range = market.max - market.min || 1;
  const sellerPct = Math.max(0, Math.min(100, ((sellerPrice - market.min) / range) * 100));
  const avgPct = ((market.avg - market.min) / range) * 100;

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: pad, border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
            {lang === "fr" ? "Conseil tarifaire" : "Pricing Advisor"}
          </span>
          {advice && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: advice.color,
              background: advice.bg, padding: "2px 8px", borderRadius: 4,
            }}>
              {advice.icon} {advice.status === "good" ? "Optimal" : advice.status === "high" ? "Eleve" : advice.status === "low" ? "Bas" : "OK"}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "#94a3b8", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          ▼
        </span>
      </button>

      {expanded && (
        <div style={{ padding: `0 ${pad}px ${pad}px` }}>
          {/* Advice text */}
          {advice && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16,
              background: advice.bg, border: `1px solid ${advice.color}20`,
              fontSize: 13, color: advice.color, lineHeight: 1.5,
            }}>
              {advice.text}
            </div>
          )}

          {/* Price position bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
              {lang === "fr" ? "Position sur le marche" : "Market position"}
            </div>
            <div style={{ position: "relative", height: 32, background: "#f1f5f9", borderRadius: 8, overflow: "visible" }}>
              {/* Gradient bar */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: 8,
                background: "linear-gradient(90deg, #3b82f6 0%, #10b981 40%, #f59e0b 70%, #ef4444 100%)",
                opacity: 0.2,
              }} />

              {/* Average marker */}
              <div style={{
                position: "absolute", left: `${avgPct}%`, top: -4, bottom: -4,
                width: 2, background: "#64748b", zIndex: 1,
              }}>
                <div style={{
                  position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                  fontSize: 9, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap",
                }}>
                  Moy. {Math.round(market.avg)}€
                </div>
              </div>

              {/* Seller marker */}
              <div style={{
                position: "absolute", left: `calc(${sellerPct}% - 8px)`, top: 4,
                width: 16, height: 24, borderRadius: 4,
                background: advice?.color || "#E8700A", border: "2px solid #fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>€</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{Math.round(market.min)}€</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{Math.round(market.max)}€</span>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: lang === "fr" ? "Votre prix" : "Your price", value: `${Math.round(sellerPrice)}€`, color: advice?.color || "#1e293b" },
              { label: lang === "fr" ? "Moyenne" : "Average", value: `${Math.round(market.avg)}€`, color: "#64748b" },
              { label: lang === "fr" ? "Meilleur" : "Best", value: `${Math.round(market.min)}€`, color: "#3b82f6" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "10px 12px", borderRadius: 8, background: "#f8fafc",
                border: "1px solid #f1f5f9", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, textAlign: "center" }}>
            {lang === "fr" ? `Base sur ${market.count} offres similaires` : `Based on ${market.count} similar offers`}
          </div>
        </div>
      )}
    </div>
  );
}
