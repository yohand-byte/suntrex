/**
 * SUNTREX — useAdminData Hook
 *
 * Fetches platform-wide admin stats from the admin-stats Netlify function.
 * Falls back to mock data when the function is unavailable or user is not admin.
 *
 * Pattern matches useDashboardData.js.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Mock fallback data (same shape as real data) ────────────────
const MOCK_KPI = {
  revenue: 247850, commission: 12392.50, orders: 156, avgOrder: 1589,
  activeUsers: 342, sellers: 28, buyers: 314, pendingKyc: 4, disputes: 2,
  deliveries: { total: 134, inTransit: 18, delivered: 112, issue: 4 },
  byStatus: { negotiation: 12, confirmed: 18, paid: 24, shipped: 14, delivered: 78, completed: 6, disputed: 2, cancelled: 2 },
};

const MOCK_TRANSACTIONS = [
  { id: "ST-2847", buyer: "SolarPro France", seller: "QUALIWATT", product: "Huawei SUN2000-10KTL-M2", qty: 10, total: 18500, commission: 878.75, status: "shipped", date: "2026-02-27", flag: "\u{1F1EB}\u{1F1F7}" },
  { id: "ST-2846", buyer: "GreenTech Berlin", seller: "SolarMax DE", product: "Deye SUN-12K-SG04LP3", qty: 5, total: 9750, commission: 463.13, status: "paid", date: "2026-02-27", flag: "\u{1F1E9}\u{1F1EA}" },
  { id: "ST-2845", buyer: "Volta Instaladores", seller: "QUALIWATT", product: "Huawei LUNA2000-10-S0", qty: 8, total: 32000, commission: 1520, status: "delivered", date: "2026-02-26", flag: "\u{1F1EA}\u{1F1F8}" },
  { id: "ST-2844", buyer: "NL Solar BV", seller: "EnergyParts NL", product: "Hoymiles HMS-2000-4T", qty: 50, total: 15000, commission: 712.50, status: "shipped", date: "2026-02-26", flag: "\u{1F1F3}\u{1F1F1}" },
  { id: "ST-2843", buyer: "Italia Solar Srl", seller: "PV Direct IT", product: "Jinko Tiger Neo 580W", qty: 100, total: 23000, commission: 1092.50, status: "disputed", date: "2026-02-25", flag: "\u{1F1EE}\u{1F1F9}" },
  { id: "ST-2842", buyer: "BelSol SPRL", seller: "QUALIWATT", product: "Huawei SUN2000-5KTL-M1", qty: 20, total: 14000, commission: 665, status: "delivered", date: "2026-02-25", flag: "\u{1F1E7}\u{1F1EA}" },
  { id: "ST-2841", buyer: "SunCraft GmbH", seller: "SolarMax DE", product: "Deye SUN-8K-SG04LP3", qty: 15, total: 19500, commission: 926.25, status: "delivered", date: "2026-02-24", flag: "\u{1F1E9}\u{1F1EA}" },
  { id: "ST-2840", buyer: "Eco Watt France", seller: "PV Express FR", product: "Trina Vertex S+ 445W", qty: 200, total: 42000, commission: 1995, status: "confirmed", date: "2026-02-24", flag: "\u{1F1EB}\u{1F1F7}" },
];

const MOCK_SELLERS = [
  { id: 1, name: "QUALIWATT", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", products: 124, revenue: 89500, commission: 4251.25, kyc: "verified", tier: "platinum", rating: 4.9, joined: "2026-01-15" },
  { id: 2, name: "SolarMax DE", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", products: 87, revenue: 62300, commission: 2959.25, kyc: "verified", tier: "gold", rating: 4.7, joined: "2026-01-20" },
  { id: 3, name: "EnergyParts NL", country: "NL", flag: "\u{1F1F3}\u{1F1F1}", products: 56, revenue: 34200, commission: 1624.50, kyc: "verified", tier: "silver", rating: 4.5, joined: "2026-02-01" },
  { id: 4, name: "PV Direct IT", country: "IT", flag: "\u{1F1EE}\u{1F1F9}", products: 42, revenue: 28100, commission: 1334.75, kyc: "verified", tier: "silver", rating: 4.3, joined: "2026-02-05" },
  { id: 5, name: "PV Express FR", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", products: 31, revenue: 42000, commission: 1995, kyc: "pending", tier: "bronze", rating: 0, joined: "2026-02-20" },
  { id: 6, name: "SunPower ES", country: "ES", flag: "\u{1F1EA}\u{1F1F8}", products: 0, revenue: 0, commission: 0, kyc: "pending", tier: "none", rating: 0, joined: "2026-02-27" },
];

const MOCK_MONTHLY = [
  { label: "Avr 2025", value: 0 }, { label: "Mai 2025", value: 0 },
  { label: "Jun 2025", value: 0 }, { label: "Jul 2025", value: 0 },
  { label: "Aoû 2025", value: 0 }, { label: "Sep 2025", value: 0 },
  { label: "Oct 2025", value: 0 }, { label: "Nov 2025", value: 0 },
  { label: "Déc 2025", value: 0 }, { label: "Jan 2026", value: 68200 },
  { label: "Fév 2026", value: 127450 }, { label: "Mar 2026", value: 52200 },
];

const MOCK_DATA = {
  kpi: MOCK_KPI,
  transactions: MOCK_TRANSACTIONS,
  sellers: MOCK_SELLERS,
  monthlyRevenue: MOCK_MONTHLY,
};

// ── API call helper ─────────────────────────────────────────────
async function fetchAdminStats(token) {
  const baseUrl = import.meta.env.VITE_API_BASE || "";
  const url = baseUrl ? `${baseUrl}/.netlify/functions/admin-stats` : "/.netlify/functions/admin-stats";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ action: "all" }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Unknown error");
  return json.data;
}

// ── Hook ────────────────────────────────────────────────────────
export function useAdminData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase not configured");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const result = await fetchAdminStats(session.access_token);

      // Check if we got meaningful data
      if (result && result.kpi && typeof result.kpi.activeUsers === "number") {
        setData(result);
        setUsingMock(false);
      } else {
        setData(MOCK_DATA);
        setUsingMock(true);
      }
    } catch (err) {
      console.warn("[useAdminData] Falling back to mock:", err.message);
      setData(MOCK_DATA);
      setUsingMock(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, usingMock, refresh };
}

// Export mocks for AdminDashboard fallback rendering during load
export { MOCK_DATA, MOCK_KPI, MOCK_TRANSACTIONS, MOCK_SELLERS, MOCK_MONTHLY };
