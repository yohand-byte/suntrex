import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

const MOCK_REVIEWS = [
  { id: 1, from: "SolarPro France", rating: 5, comment: "Excellent service, livraison rapide et produit conforme.", date: "2026-02-20", product: "Huawei SUN2000-10K" },
  { id: 2, from: "GreenBuild BE", rating: 5, comment: "Tres professionnel, prix competitif.", date: "2026-02-15", product: "Deye SUN-12K" },
  { id: 3, from: "InstallSol ES", rating: 4, comment: "Good products, delivery was a bit slow.", date: "2026-02-10", product: "Enphase IQ8-HC" },
];

const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

export default function ReviewsPage() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();

  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Avis" : "Reviews"}
      </h1>

      {/* Summary */}
      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: T.text, fontFamily: T.font }}>{avgRating}</div>
        <div>
          <div style={{ fontSize: 20, color: T.yellow }}>{"★".repeat(Math.round(parseFloat(avgRating)))}{"☆".repeat(5 - Math.round(parseFloat(avgRating)))}</div>
          <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{MOCK_REVIEWS.length} {lang === "fr" ? "avis" : "reviews"}</div>
        </div>
      </div>

      {MOCK_REVIEWS.length === 0 ? (
        <EmptyState icon={"\u2B50"} title={lang === "fr" ? "Aucun avis" : "No reviews"} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MOCK_REVIEWS.map(review => (
            <div key={review.id} style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{review.from}</span>
                  <span style={{ fontSize: 14, color: T.yellow }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                </div>
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{formatDate(review.date)}</span>
              </div>
              <p style={{ fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.5, margin: 0 }}>{review.comment}</p>
              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 8 }}>
                {lang === "fr" ? "Produit:" : "Product:"} {review.product}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
