import { useState } from "react";
import useSellerTier, { computeTier } from "../../hooks/useSellerTier";

const TIER_ICONS = {
  platinum: "💎",
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

/**
 * SellerBadge — displays the seller's trust tier with tooltip
 *
 * Props:
 *   sellerId  — fetch tier from DB
 *   OR tier   — pass precomputed tier object
 *   size      — "sm" | "md" | "lg" (default "md")
 *   showLabel — show tier name next to icon (default true)
 */
export default function SellerBadge({ sellerId, tier: tierProp, size = "md", showLabel = true }) {
  const { tier: fetchedTier, loading } = sellerId && !tierProp
    ? useSellerTier(sellerId)
    : { tier: tierProp || computeTier({}), loading: false };

  const [showTooltip, setShowTooltip] = useState(false);

  const tier = tierProp || fetchedTier;
  if (loading || !tier) return null;

  const sizes = { sm: { font: 10, icon: 12, pad: "2px 6px" }, md: { font: 11, icon: 14, pad: "3px 10px" }, lg: { font: 13, icon: 16, pad: "4px 14px" } };
  const s = sizes[size] || sizes.md;

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: s.pad, borderRadius: 6, background: tier.bg,
        border: `1px solid ${tier.color}30`, cursor: "default",
      }}>
        <span style={{ fontSize: s.icon }}>{TIER_ICONS[tier.id] || "🏷"}</span>
        {showLabel && (
          <span style={{ fontSize: s.font, fontWeight: 700, color: tier.color, letterSpacing: "0.02em" }}>
            {tier.label}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && tier.stats && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", color: "#fff", borderRadius: 8, padding: "10px 14px",
          fontSize: 11, whiteSpace: "nowrap", zIndex: 1000, minWidth: 180,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: tier.color }}>{TIER_ICONS[tier.id]} {tier.label} Seller</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Row label="Transactions" value={tier.stats.transactionCount} />
            <Row label="Note moyenne" value={tier.stats.avgRating ? tier.stats.avgRating.toFixed(1) + " / 5" : "N/A"} />
            <Row label="Livraison OK" value={tier.stats.deliveryRate ? Math.round(tier.stats.deliveryRate * 100) + "%" : "N/A"} />
            <Row label="Anciennete" value={tier.stats.monthsActive + " mois"} />
          </div>
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
            borderTop: "6px solid #1e293b",
          }} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
