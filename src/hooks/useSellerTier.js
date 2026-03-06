import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TIERS = [
  {
    id: "platinum",
    label: "Platinum",
    color: "#475569",
    bg: "#f1f5f9",
    minTx: 100, minRating: 4.8, minDelivery: 0.95, minMonths: 12,
  },
  {
    id: "gold",
    label: "Gold",
    color: "#D4A017",
    bg: "#fefce8",
    minTx: 50, minRating: 4.5, minDelivery: 0.90, minMonths: 6,
  },
  {
    id: "silver",
    label: "Silver",
    color: "#9CA3AF",
    bg: "#f9fafb",
    minTx: 20, minRating: 4.0, minDelivery: 0.85, minMonths: 3,
  },
  {
    id: "bronze",
    label: "Bronze",
    color: "#CD7F32",
    bg: "#fffbeb",
    minTx: 0, minRating: 0, minDelivery: 0, minMonths: 0,
  },
];

function computeTier(stats) {
  const { transactionCount = 0, avgRating = 0, deliveryRate = 0, monthsActive = 0 } = stats;
  for (const tier of TIERS) {
    if (
      transactionCount >= tier.minTx &&
      avgRating >= tier.minRating &&
      deliveryRate >= tier.minDelivery &&
      monthsActive >= tier.minMonths
    ) {
      return { ...tier, stats };
    }
  }
  return { ...TIERS[3], stats };
}

export { TIERS, computeTier };

export default function useSellerTier(sellerId) {
  const [tier, setTier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }

    async function fetchStats() {
      setLoading(true);

      if (!supabase) {
        // Fallback mock data
        setTier(computeTier({ transactionCount: 5, avgRating: 4.2, deliveryRate: 0.88, monthsActive: 2 }));
        setLoading(false);
        return;
      }

      try {
        // Count completed orders for this seller
        const { count: txCount } = await supabase
          .from("Order")
          .select("id", { count: "exact", head: true })
          .eq("sellerId", sellerId)
          .in("status", ["COMPLETED", "PAID", "SHIPPED"]);

        // Average rating from reviews
        const { data: reviews } = await supabase
          .from("Review")
          .select("rating")
          .eq("reviewee_id", sellerId);

        const avgRating = reviews?.length
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0;

        // Delivery rate (delivered / total shipped)
        const { count: shipped } = await supabase
          .from("Order")
          .select("id", { count: "exact", head: true })
          .eq("sellerId", sellerId)
          .not("shippedAt", "is", null);

        const { count: delivered } = await supabase
          .from("Order")
          .select("id", { count: "exact", head: true })
          .eq("sellerId", sellerId)
          .not("deliveredAt", "is", null);

        const deliveryRate = shipped > 0 ? delivered / shipped : 0;

        // Account age
        const { data: user } = await supabase
          .from("User")
          .select("created_at")
          .eq("id", sellerId)
          .single();

        const monthsActive = user?.created_at
          ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))
          : 0;

        setTier(computeTier({
          transactionCount: txCount || 0,
          avgRating,
          deliveryRate,
          monthsActive,
        }));
      } catch {
        setTier(computeTier({ transactionCount: 0, avgRating: 0, deliveryRate: 0, monthsActive: 0 }));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [sellerId]);

  return { tier, loading };
}
