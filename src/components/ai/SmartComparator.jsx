import { useState, useMemo } from "react";
import useResponsive from "../../hooks/useResponsive";

var VITE_API = import.meta.env.VITE_SUPPORT_AI_ENDPOINT || "/api/support-chat-ai";

function formatPrice(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function specValue(product, key) {
  if (key === "price") return formatPrice(product.price);
  if (key === "power") return product.power || product.powerKw ? (product.powerKw || product.power) + " kW" : "—";
  if (key === "weight") return product.weight ? product.weight + " kg" : "—";
  if (key === "efficiency") return product.efficiency || "—";
  if (key === "warranty") return product.warranty || "—";
  if (key === "protection") return product.protection || "—";
  if (key === "phases") return product.phases ? product.phases + "P" : "—";
  if (key === "mppt") return product.mppt || "—";
  if (key === "stock") return product.stock > 0 ? product.stock + " pcs" : "Rupture";
  if (key === "brand") return product.brand;
  if (key === "category") return product.category;
  return "—";
}

var SPEC_ROWS = [
  { key: "brand", label: "Marque", labelEn: "Brand" },
  { key: "price", label: "Prix", labelEn: "Price" },
  { key: "power", label: "Puissance", labelEn: "Power" },
  { key: "phases", label: "Phases", labelEn: "Phases" },
  { key: "mppt", label: "MPPT", labelEn: "MPPT" },
  { key: "efficiency", label: "Rendement", labelEn: "Efficiency" },
  { key: "weight", label: "Poids", labelEn: "Weight" },
  { key: "protection", label: "Protection", labelEn: "Protection" },
  { key: "warranty", label: "Garantie", labelEn: "Warranty" },
  { key: "stock", label: "Stock", labelEn: "Stock" },
];

export default function SmartComparator({ products, onRemove, lang }) {
  var isFr = (lang || "fr") === "fr";
  var { isMobile } = useResponsive();
  var [aiResult, setAiResult] = useState(null);
  var [aiLoading, setAiLoading] = useState(false);
  var [aiError, setAiError] = useState(null);

  var cheapest = useMemo(function () {
    if (!products || products.length === 0) return null;
    return products.reduce(function (min, p) {
      return p.price < min.price ? p : min;
    });
  }, [products]);

  if (!products || products.length < 2) return null;

  function askAI() {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    var productDescriptions = products.map(function (p) {
      return p.name + " (" + p.brand + ") — " + formatPrice(p.price) + ", " + (p.powerKw || p.power || "?") + " kW, " + (p.efficiency || "?") + " rendement, " + (p.warranty || "?") + " garantie, stock: " + (p.stock || 0);
    }).join("\n");

    var prompt = "Compare ces produits photovoltaiques pour un professionnel du solaire. Pour chaque produit, donne les avantages et inconvenients. Termine par ta recommandation.\n\n" + productDescriptions;

    fetch(VITE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setAiResult(data.reply || data.message || data.response || JSON.stringify(data));
        setAiLoading(false);
      })
      .catch(function (err) {
        setAiError(isFr ? "Erreur lors de l'analyse IA. Reessayez." : "AI analysis error. Try again.");
        setAiLoading(false);
      });
  }

  var colW = isMobile ? 120 : 160;
  var labelW = isMobile ? 80 : 120;

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
      overflow: "hidden", marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "14px 16px" : "16px 24px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>&#x2696;</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
            {isFr ? "Comparateur" : "Comparator"}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#E8700A",
            background: "#fff7ed", padding: "2px 8px", borderRadius: 4,
          }}>
            {products.length} {isFr ? "produits" : "products"}
          </span>
        </div>
        <button
          onClick={askAI}
          disabled={aiLoading}
          aria-label={isFr ? "Demander l'avis IA" : "Ask AI opinion"}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: aiLoading ? "#94a3b8" : "#E8700A", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: aiLoading ? "wait" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {aiLoading ? (isFr ? "Analyse..." : "Analyzing...") : (isFr ? "Avis IA" : "AI Opinion")}
        </button>
      </div>

      {/* Comparison table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
          {/* Product headers */}
          <thead>
            <tr>
              <th style={{ width: labelW, padding: "12px 8px", textAlign: "left", fontSize: 11, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>
                {isFr ? "Spec." : "Spec."}
              </th>
              {products.map(function (p) {
                return (
                  <th key={p.id} style={{ minWidth: colW, padding: "12px 8px", textAlign: "center", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}>
                    <div style={{ position: "relative" }}>
                      {onRemove && (
                        <button
                          onClick={function () { onRemove(p.id); }}
                          aria-label={"Remove " + p.name}
                          style={{
                            position: "absolute", top: -4, right: -4,
                            width: 20, height: 20, borderRadius: 10,
                            border: "none", background: "#ef4444", color: "#fff",
                            fontSize: 11, cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center",
                          }}
                        >
                          x
                        </button>
                      )}
                      <div style={{
                        width: 48, height: 48, borderRadius: 8,
                        background: "#f8fafc", border: "1px solid #f1f5f9",
                        margin: "0 auto 6px", display: "flex",
                        alignItems: "center", justifyContent: "center", overflow: "hidden",
                      }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} loading="lazy" width="44" height="44" style={{ maxWidth: 44, maxHeight: 44, objectFit: "contain" }} />
                          : <span style={{ fontSize: 9, color: "#94a3b8" }}>{p.brand}</span>
                        }
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b", lineHeight: 1.3 }}>
                        {p.name.length > 30 ? p.name.slice(0, 30) + "..." : p.name}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {SPEC_ROWS.map(function (row) {
              return (
                <tr key={row.key}>
                  <td style={{
                    padding: "8px", fontSize: 11, fontWeight: 600,
                    color: "#64748b", borderBottom: "1px solid #f8fafc",
                    whiteSpace: "nowrap",
                  }}>
                    {isFr ? row.label : row.labelEn}
                  </td>
                  {products.map(function (p) {
                    var val = specValue(p, row.key);
                    var isBest = false;
                    if (row.key === "price" && cheapest && p.id === cheapest.id) isBest = true;
                    if (row.key === "stock" && p.stock > 0) {
                      var maxStock = Math.max.apply(null, products.map(function (x) { return x.stock || 0; }));
                      if (p.stock === maxStock) isBest = true;
                    }
                    return (
                      <td key={p.id} style={{
                        padding: "8px", textAlign: "center", fontSize: 12,
                        color: isBest ? "#10b981" : "#1e293b",
                        fontWeight: isBest ? 700 : 400,
                        borderBottom: "1px solid #f8fafc",
                        background: isBest ? "#ecfdf520" : "transparent",
                      }}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Result */}
      {aiError && (
        <div style={{ padding: "12px 24px", background: "#fef2f2", color: "#ef4444", fontSize: 13 }}>
          {aiError}
        </div>
      )}
      {aiResult && (
        <div style={{ padding: isMobile ? 16 : 24, borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>&#x1F916;</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              {isFr ? "Analyse IA" : "AI Analysis"}
            </span>
          </div>
          <div style={{
            padding: "14px 18px", borderRadius: 10, background: "#f8fafc",
            border: "1px solid #e2e8f0", fontSize: 13, color: "#334155",
            lineHeight: 1.7, whiteSpace: "pre-wrap",
          }}>
            {aiResult}
          </div>
        </div>
      )}
    </div>
  );
}
