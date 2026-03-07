import { useTranslation } from "react-i18next";

const S_BADGE = { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:999, fontSize:11, fontWeight:500, whiteSpace:"nowrap" };

export default function SellerBadge({ offer, compactMobile = false, showRating = true }) {
  const { t } = useTranslation(["translation", "common"]);
  const tcommon = (key, opts) => t(`common:${key}`, opts);

  const badgeStyle = compactMobile
    ? { ...S_BADGE, padding: "2px 6px", fontSize: 10, gap: 3 }
    : S_BADGE;

  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
      {showRating && (
        <span style={{ ...badgeStyle, background:"#f0f7f0", color:"#2e7d32" }}>⭐ {offer.rating} ({offer.reviews})</span>
      )}
      {offer.badge === "trusted" && <span style={{ ...badgeStyle, background:"#e8f5e9", color:"#1b5e20" }}>✓ {tcommon("trustedSeller")}</span>}
      {offer.bankTransfer && <span style={{ ...badgeStyle, background:"#e3f2fd", color:"#1565c0" }}>🏦 {tcommon("secureTransfer")}</span>}
      {offer.delivery === "suntrex" && <span style={{ ...badgeStyle, background:"#fff3e0", color:"#e65100" }}>🚚 SUNTREX Delivery</span>}
    </div>
  );
}
