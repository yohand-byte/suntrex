import { useState, useEffect, useCallback } from "react";
import useResponsive from "../../hooks/useResponsive";
import QRCodeGenerator from "./QRCodeGenerator";
import DeliveryPhotoUpload from "./DeliveryPhotoUpload";

const API_URL = import.meta.env.VITE_API_URL || "";

const DELIVERY_STEPS = [
  {
    key: "seller_dispatch",
    label: "Expedition vendeur",
    labelEn: "Seller Dispatch",
    icon: "📦",
    desc: "Photos du colis + contenu, QR code genere",
    requiresPhoto: true,
    actor: "seller",
  },
  {
    key: "pickup_inspection",
    label: "Pickup SUNTREX",
    labelEn: "SUNTREX Pickup",
    icon: "🔍",
    desc: "Scan QR, inspection visuelle, photo + GPS",
    requiresPhoto: true,
    actor: "suntrex",
  },
  {
    key: "in_transit",
    label: "En transit",
    labelEn: "In Transit",
    icon: "🚛",
    desc: "Tracking temps reel via transporteur",
    requiresPhoto: false,
    actor: "system",
  },
  {
    key: "delivery_confirmation",
    label: "Livraison",
    labelEn: "Delivery",
    icon: "✅",
    desc: "Photo livraison, verification buyer",
    requiresPhoto: true,
    actor: "buyer",
  },
];

const VERIFICATION_OPTIONS = [
  { value: "ok", label: "Tout est conforme", color: "#10b981" },
  { value: "damaged", label: "Colis endommage", color: "#f59e0b" },
  { value: "missing", label: "Articles manquants", color: "#ef4444" },
];

export default function DeliveryVerification({ order, currentUser, delivery: deliveryProp }) {
  const { isMobile } = useResponsive();
  const [delivery, setDelivery] = useState(deliveryProp || null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);

  const pad = isMobile ? 16 : 24;
  const isSeller = currentUser?.id === order?.sellerId;
  const isBuyer = currentUser?.id === order?.buyerId;

  const currentStepIndex = delivery?.steps
    ? DELIVERY_STEPS.findIndex(s => !delivery.steps[s.key]?.completedAt)
    : 0;

  const fetchDelivery = useCallback(async () => {
    if (!order?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/delivery/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDelivery(data.delivery);
      }
    } catch {}
  }, [order?.id]);

  useEffect(() => { fetchDelivery(); }, [fetchDelivery]);

  const updateStep = useCallback(async (stepKey, photoData) => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const token = (await (await import("../../lib/supabase")).supabase?.auth.getSession())?.data?.session?.access_token;
      const res = await fetch(`${API_URL}/api/delivery/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id, step: stepKey, photo: photoData }),
      });
      const data = await res.json();
      if (data.success) {
        setDelivery(data.delivery);
      }
    } catch {}
    setLoading(false);
  }, [order?.id]);

  const handleVerify = useCallback(async (status) => {
    if (!order?.id) return;
    setVerification(status);
    setLoading(true);
    try {
      const token = (await (await import("../../lib/supabase")).supabase?.auth.getSession())?.data?.session?.access_token;
      const res = await fetch(`${API_URL}/api/delivery/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id, status }),
      });
      const data = await res.json();
      if (data.success) setDelivery(data.delivery);
    } catch {}
    setLoading(false);
  }, [order?.id]);

  if (!order) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: pad, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "#1e293b" }}>
            🚛 SUNTREX DELIVERY
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            Verification et suivi de votre colis
          </div>
        </div>
        {delivery?.trackingNumber && (
          <div style={{ fontSize: 11, color: "#E8700A", fontWeight: 700, background: "#fff7ed", padding: "4px 10px", borderRadius: 6 }}>
            {delivery.trackingCarrier} {delivery.trackingNumber}
          </div>
        )}
      </div>

      {/* Steps */}
      <div style={{ padding: pad }}>
        {DELIVERY_STEPS.map((step, i) => {
          const stepData = delivery?.steps?.[step.key] || {};
          const isComplete = !!stepData.completedAt;
          const isCurrent = i === currentStepIndex;
          const canAct = isCurrent && (
            (step.actor === "seller" && isSeller) ||
            (step.actor === "buyer" && isBuyer) ||
            step.actor === "system" || step.actor === "suntrex"
          );

          return (
            <div key={step.key} style={{ display: "flex", gap: 12, marginBottom: i < DELIVERY_STEPS.length - 1 ? 0 : 0 }}>
              {/* Timeline line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: isComplete ? "#10b981" : isCurrent ? "#E8700A" : "#f1f5f9",
                  color: isComplete || isCurrent ? "#fff" : "#94a3b8", fontSize: 14, flexShrink: 0,
                  border: isCurrent ? "2px solid #E8700A" : "none",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(232,112,10,0.15)" : "none",
                }}>
                  {isComplete ? "✓" : step.icon}
                </div>
                {i < DELIVERY_STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 20, background: isComplete ? "#10b981" : "#e2e8f0" }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: i < DELIVERY_STEPS.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isComplete || isCurrent ? "#1e293b" : "#94a3b8" }}>
                    {step.label}
                  </span>
                  {isComplete && stepData.completedAt && (
                    <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>
                      {new Date(stepData.completedAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{step.desc}</div>

                {/* Completed photo */}
                {isComplete && stepData.photoUrl && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={stepData.photoUrl} alt={step.label} style={{ width: "100%", maxWidth: 240, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    {stepData.gps && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                        GPS: {stepData.gps.lat?.toFixed(4)}, {stepData.gps.lng?.toFixed(4)}
                      </div>
                    )}
                  </div>
                )}

                {/* QR Code for seller dispatch */}
                {isCurrent && step.key === "seller_dispatch" && isSeller && (
                  <div style={{ marginBottom: 12 }}>
                    <QRCodeGenerator orderId={order.id} sellerId={order.sellerId} size={160} />
                  </div>
                )}

                {/* Photo upload for current step */}
                {canAct && step.requiresPhoto && !isComplete && (
                  <DeliveryPhotoUpload
                    orderId={order.id}
                    stepKey={step.key}
                    onUploaded={(photo) => updateStep(step.key, photo)}
                  />
                )}

                {/* Buyer verification at delivery */}
                {isCurrent && step.key === "delivery_confirmation" && isBuyer && !verification && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
                      Etat du colis a la reception :
                    </div>
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                      {VERIFICATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleVerify(opt.value)}
                          disabled={loading}
                          style={{
                            padding: "10px 16px", borderRadius: 8, border: `1px solid ${opt.color}`,
                            background: "#fff", color: opt.color, fontWeight: 600, fontSize: 12,
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flex: 1,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
