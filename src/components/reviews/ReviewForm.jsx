import { useState } from "react";
import useResponsive from "../../hooks/useResponsive";
import { supabase } from "../../lib/supabase";

export default function ReviewForm({ orderId, sellerId, sellerName, onSubmitted }) {
  const { isMobile } = useResponsive();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error: insertErr } = await supabase.from("Review").insert({
          reviewer_id: user.id,
          reviewee_id: sellerId,
          order_id: orderId,
          rating,
          comment: comment.trim() || null,
          created_at: new Date().toISOString(),
        });

        if (insertErr) throw insertErr;
      }

      setSubmitted(true);
      if (onSubmitted) onSubmitted({ rating, comment });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        background: "#ecfdf5", borderRadius: 12, border: "1px solid #a7f3d0",
        padding: isMobile ? 16 : 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#065f46", fontFamily: "'DM Sans', sans-serif" }}>
          Merci pour votre avis !
        </div>
        <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>
          {"★".repeat(rating)} — {sellerName || "Vendeur"}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
      padding: isMobile ? 16 : 24,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        Evaluer {sellerName || "le vendeur"}
      </div>

      {/* Star rating */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 28, padding: 2, transition: "transform 0.15s",
              transform: (hover || rating) >= star ? "scale(1.15)" : "scale(1)",
              color: (hover || rating) >= star ? "#f59e0b" : "#d1d5db",
            }}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span style={{ fontSize: 13, color: "#64748b", alignSelf: "center", marginLeft: 8 }}>
            {rating}/5
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partagez votre experience (optionnel)..."
        rows={3}
        style={{
          width: "100%", padding: 12, borderRadius: 8,
          border: "1px solid #e2e8f0", fontSize: 13,
          fontFamily: "'DM Sans', sans-serif", color: "#1e293b",
          resize: "vertical", marginBottom: 12,
        }}
      />

      {error && (
        <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: rating === 0 ? "#94a3b8" : "#E8700A",
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: rating === 0 ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Envoi..." : "Envoyer mon avis"}
      </button>
    </div>
  );
}
