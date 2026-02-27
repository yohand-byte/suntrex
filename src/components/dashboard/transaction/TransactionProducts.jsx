import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import PriceEditor from "../shared/PriceEditor";

const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

// TransactionProducts — editable product card(s) within a transaction
// Props: items, role ("buyer"|"seller"), onUpdatePrice, onUpdateQty, onRemoveItem, incoterms, deliveryCost, onEditDeliveryCost, lang
export default function TransactionProducts({ items = [], role, onUpdatePrice, onUpdateQty, onRemoveItem, incoterms = "Delivery on premise", deliveryCost, onEditDeliveryCost, lang = "fr" }) {
  const { isMobile } = useResponsive();
  const isSeller = role === "seller";

  const subtotal = items.reduce((sum, item) => {
    const price = item.editedPrice ?? item.price;
    const qty = item.editedQty ?? item.qty;
    return sum + price * qty;
  }, 0);
  const vatTotal = items.reduce((sum, item) => {
    const price = item.editedPrice ?? item.price;
    const qty = item.editedQty ?? item.qty;
    return sum + price * qty * (item.vatRate || 0);
  }, 0);
  const total = subtotal + vatTotal + (deliveryCost || 0);

  return (
    <div style={{
      background: T.card,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
    }}>
      {/* Product rows */}
      {items.map((item, idx) => (
        <ProductRow
          key={item.id || idx}
          item={item}
          isSeller={isSeller}
          isMobile={isMobile}
          onUpdatePrice={onUpdatePrice}
          onUpdateQty={onUpdateQty}
          onRemoveItem={onRemoveItem}
          incoterms={incoterms}
          isLast={idx === items.length - 1 && !deliveryCost && deliveryCost !== 0}
          lang={lang}
        />
      ))}

      {/* Delivery cost row */}
      <div style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "flex-end",
        gap: isMobile ? 8 : 20,
        padding: "12px 20px",
        borderTop: `1px solid ${T.borderLight}`,
        background: T.bg,
      }}>
        <span style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, fontWeight: 500 }}>
          {lang === "fr" ? "Livraison (brut):" : "Delivery (gross):"}
        </span>
        {deliveryCost != null ? (
          <PriceEditor
            value={deliveryCost}
            onSave={isSeller ? onEditDeliveryCost : undefined}
            disabled={!isSeller}
          />
        ) : (
          <span style={{ fontSize: 13, color: T.accent, fontFamily: T.font, fontWeight: 600, fontStyle: "italic" }}>
            {lang === "fr" ? "Prix sur demande" : "Price on request"}
            {isSeller && (
              <button
                onClick={() => onEditDeliveryCost?.(0)}
                style={{
                  marginLeft: 10,
                  background: T.accent, color: "#fff",
                  border: "none", borderRadius: T.radiusSm,
                  padding: "4px 12px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: T.font,
                }}
              >
                {lang === "fr" ? "Definir" : "Set"}
              </button>
            )}
          </span>
        )}
      </div>

      {/* Total row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 20,
        padding: "14px 20px",
        borderTop: `1px solid ${T.border}`,
        background: T.card,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
          {lang === "fr" ? "Total (brut):" : "Total (gross):"}
        </span>
        <span style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.font }}>
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}

// ── Individual product row ─────────────────────────────────────────
function ProductRow({ item, isSeller, isMobile, onUpdatePrice, onUpdateQty, onRemoveItem, incoterms, lang }) {
  const [showDetails, setShowDetails] = useState(false);
  const price = item.editedPrice ?? item.price;
  const qty = item.editedQty ?? item.qty;
  const lineTotal = price * qty;
  const vat = lineTotal * (item.vatRate || 0);

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 12 : 0,
      padding: isMobile ? 14 : "14px 20px",
      borderBottom: `1px solid ${T.borderLight}`,
    }}>
      {/* Product image */}
      <div style={{
        width: isMobile ? 80 : 72,
        height: isMobile ? 80 : 72,
        borderRadius: T.radiusSm,
        background: T.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", flexShrink: 0,
        marginRight: isMobile ? 0 : 16,
      }}>
        <img
          src={item.image}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "\uD83D\uDCE6"; }}
        />
      </div>

      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>
          {item.name}
        </div>
        {item.sku && (
          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
            #{item.sku}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 12, color: T.textSec, fontFamily: T.font }}>
          {item.availability != null && (
            <span>{lang === "fr" ? "Dispo" : "Avail"}: {item.availability} pcs</span>
          )}
          <span>Incoterms: {incoterms}</span>
          {item.shipDays && (
            <span>{lang === "fr" ? `Envoi: ~${item.shipDays} jours` : `Ships: ~${item.shipDays} days`}</span>
          )}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: "none", border: "none",
            color: T.accent, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
            padding: "4px 0", marginTop: 4,
          }}
        >
          {showDetails
            ? (lang === "fr" ? "Masquer les details" : "Hide details")
            : (lang === "fr" ? "Details produit" : "Product details")}
        </button>
        {showDetails && (
          <div style={{
            marginTop: 8, padding: 12,
            background: T.bg, borderRadius: T.radiusSm,
            fontSize: 12, color: T.textSec, fontFamily: T.font,
            lineHeight: 1.6,
          }}>
            {item.specs || (lang === "fr" ? "Specifications techniques du produit..." : "Technical product specifications...")}
          </div>
        )}
      </div>

      {/* Quantity + Price */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        gap: isMobile ? 16 : 8,
        alignItems: isMobile ? "center" : "flex-end",
        flexShrink: 0,
        minWidth: isMobile ? "auto" : 160,
      }}>
        {/* Quantity */}
        <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>
          {lang === "fr" ? "Qte" : "Qty"}: <strong style={{ color: T.text }}>{qty} pc</strong>
          {isSeller && (
            <button
              onClick={() => {
                const newQty = prompt(lang === "fr" ? "Nouvelle quantite:" : "New quantity:", qty);
                if (newQty && !isNaN(newQty) && parseInt(newQty) > 0) {
                  onUpdateQty?.(item.id, parseInt(newQty));
                }
              }}
              style={{
                marginLeft: 6,
                background: "none", border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm, padding: "1px 6px",
                fontSize: 11, color: T.accent, cursor: "pointer",
                fontFamily: T.font,
              }}
            >
              {lang === "fr" ? "Modifier" : "Edit"}
            </button>
          )}
        </div>

        {/* Price */}
        <div>
          <PriceEditor
            value={price}
            onSave={isSeller ? (newPrice) => onUpdatePrice?.(item.id, newPrice) : undefined}
            disabled={!isSeller}
            label={lang === "fr" ? "Prix:" : "Price:"}
          />
        </div>

        {/* VAT + Net */}
        <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, textAlign: isMobile ? "left" : "right" }}>
          <div>TVA: {formatPrice(vat)}</div>
          <div style={{ fontWeight: 600, color: T.text }}>Net: {formatPrice(lineTotal + vat)}</div>
        </div>
      </div>
    </div>
  );
}
