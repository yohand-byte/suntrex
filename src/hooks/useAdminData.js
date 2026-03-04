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
  revenue: 487320, commission: 23147.70, orders: 243, avgOrder: 2005,
  activeUsers: 578, sellers: 42, buyers: 536, pendingKyc: 7, disputes: 3,
  deliveries: { total: 198, inTransit: 24, delivered: 167, issue: 7 },
  byStatus: { negotiation: 18, confirmed: 26, paid: 34, shipped: 22, in_transit: 24, delivered: 98, completed: 12, disputed: 3, cancelled: 6 },
  growth: { revenue: 23, orders: 18, users: 31, sellers: 15 },
  pendingRegistrations: 5,
  monthlyCommission: 6842.30,
};

const MOCK_TRANSACTIONS = [
  { id: "ST-3012", buyer: "SolarPro France", seller: "QUALIWATT", product: "Huawei SUN2000-10KTL-M2", qty: 10, total: 18500, commission: 878.75, status: "shipped", date: "2026-03-03", flag: "\u{1F1EB}\u{1F1F7}", country: "FR" },
  { id: "ST-3011", buyer: "GreenTech Berlin", seller: "SolarMax DE", product: "Deye SUN-12K-SG04LP3", qty: 5, total: 9750, commission: 463.13, status: "paid", date: "2026-03-03", flag: "\u{1F1E9}\u{1F1EA}", country: "DE" },
  { id: "ST-3010", buyer: "Volta Instaladores", seller: "QUALIWATT", product: "Huawei LUNA2000-10-S0", qty: 8, total: 32000, commission: 1520, status: "delivered", date: "2026-03-02", flag: "\u{1F1EA}\u{1F1F8}", country: "ES" },
  { id: "ST-3009", buyer: "NL Solar BV", seller: "EnergyParts NL", product: "Hoymiles HMS-2000-4T", qty: 50, total: 15000, commission: 712.50, status: "shipped", date: "2026-03-02", flag: "\u{1F1F3}\u{1F1F1}", country: "NL" },
  { id: "ST-3008", buyer: "Italia Solar Srl", seller: "PV Direct IT", product: "Jinko Tiger Neo 580W", qty: 100, total: 23000, commission: 1092.50, status: "disputed", date: "2026-03-01", flag: "\u{1F1EE}\u{1F1F9}", country: "IT" },
  { id: "ST-3007", buyer: "BelSol SPRL", seller: "QUALIWATT", product: "Huawei SUN2000-5KTL-M1", qty: 20, total: 14000, commission: 665, status: "delivered", date: "2026-03-01", flag: "\u{1F1E7}\u{1F1EA}", country: "BE" },
  { id: "ST-3006", buyer: "SunCraft GmbH", seller: "SolarMax DE", product: "Deye SUN-8K-SG04LP3", qty: 15, total: 19500, commission: 926.25, status: "delivered", date: "2026-02-28", flag: "\u{1F1E9}\u{1F1EA}", country: "DE" },
  { id: "ST-3005", buyer: "Eco Watt France", seller: "PV Express FR", product: "Trina Vertex S+ 445W", qty: 200, total: 42000, commission: 1995, status: "confirmed", date: "2026-02-28", flag: "\u{1F1EB}\u{1F1F7}", country: "FR" },
  { id: "ST-3004", buyer: "Helios Energie", seller: "SunParts BE", product: "LONGi Hi-MO 7 580W", qty: 120, total: 27600, commission: 1311, status: "paid", date: "2026-02-27", flag: "\u{1F1E7}\u{1F1EA}", country: "BE" },
  { id: "ST-3003", buyer: "MéridienSolar", seller: "QUALIWATT", product: "BYD HVS 12.8 kWh", qty: 4, total: 16800, commission: 798, status: "in_transit", date: "2026-02-27", flag: "\u{1F1EB}\u{1F1F7}", country: "FR" },
  { id: "ST-3002", buyer: "AlpenSolar GmbH", seller: "SolarMax DE", product: "SMA Sunny Tripower 10.0", qty: 6, total: 10200, commission: 484.50, status: "delivered", date: "2026-02-26", flag: "\u{1F1E6}\u{1F1F9}", country: "AT" },
  { id: "ST-3001", buyer: "Nordic Solar ApS", seller: "EnergyParts NL", product: "Enphase IQ8+ Micro", qty: 80, total: 14400, commission: 684, status: "shipped", date: "2026-02-26", flag: "\u{1F1E9}\u{1F1F0}", country: "DK" },
  { id: "ST-3000", buyer: "LuxSun SARL", seller: "QUALIWATT", product: "Huawei SUN2000-8KTL-M1", qty: 12, total: 15600, commission: 741, status: "completed", date: "2026-02-25", flag: "\u{1F1F1}\u{1F1FA}", country: "LU" },
  { id: "ST-2999", buyer: "PolEnergy Sp.z.o.o", seller: "PV Direct IT", product: "GoodWe ET 10kW", qty: 8, total: 11200, commission: 532, status: "delivered", date: "2026-02-25", flag: "\u{1F1F5}\u{1F1F1}", country: "PL" },
  { id: "ST-2998", buyer: "SolarTech Lda", seller: "SunPower ES", product: "Growatt MIN 6000TL-X", qty: 25, total: 13750, commission: 653.13, status: "paid", date: "2026-02-24", flag: "\u{1F1F5}\u{1F1F9}", country: "PT" },
  { id: "ST-2997", buyer: "Helia GmbH", seller: "SolarMax DE", product: "Jinko Tiger Neo 440W", qty: 150, total: 31500, commission: 1496.25, status: "in_transit", date: "2026-02-24", flag: "\u{1F1E9}\u{1F1EA}", country: "DE" },
  { id: "ST-2996", buyer: "Photon NV", seller: "EnergyParts NL", product: "Trina Vertex S+ 430W", qty: 300, total: 54000, commission: 2565, status: "negotiation", date: "2026-02-23", flag: "\u{1F1E7}\u{1F1EA}", country: "BE" },
  { id: "ST-2995", buyer: "GreenPower Ltd", seller: "PV Express FR", product: "LONGi Hi-MO 6 540W", qty: 50, total: 11500, commission: 546.25, status: "cancelled", date: "2026-02-22", flag: "\u{1F1EE}\u{1F1EA}", country: "IE" },
  { id: "ST-2994", buyer: "SunMax AG", seller: "AlpenSolar AT", product: "SMA Sunny Boy 5.0", qty: 10, total: 9500, commission: 451.25, status: "delivered", date: "2026-02-21", flag: "\u{1F1E8}\u{1F1ED}", country: "CH" },
  { id: "ST-2993", buyer: "EcoSol s.r.o.", seller: "PolEnergy PL", product: "Huawei LUNA2000-5-S0", qty: 6, total: 11400, commission: 541.50, status: "shipped", date: "2026-02-20", flag: "\u{1F1E8}\u{1F1FF}", country: "CZ" },
];

const MOCK_SELLERS = [
  { id: 1, name: "QUALIWATT", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", products: 124, revenue: 96900, commission: 4602.75, kyc: "verified", tier: "platinum", rating: 4.9, joined: "2026-01-15", vat: "FR12345678901", email: "contact@qualiwatt.com", status: "active" },
  { id: 2, name: "SolarMax DE", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", products: 87, revenue: 70950, commission: 3370.13, kyc: "verified", tier: "gold", rating: 4.7, joined: "2026-01-20", vat: "DE123456789", email: "info@solarmax.de", status: "active" },
  { id: 3, name: "EnergyParts NL", country: "NL", flag: "\u{1F1F3}\u{1F1F1}", products: 56, revenue: 83400, commission: 3961.50, kyc: "verified", tier: "gold", rating: 4.6, joined: "2026-02-01", vat: "NL123456789B01", email: "sales@energyparts.nl", status: "active" },
  { id: 4, name: "PV Direct IT", country: "IT", flag: "\u{1F1EE}\u{1F1F9}", products: 42, revenue: 34200, commission: 1624.50, kyc: "verified", tier: "silver", rating: 4.3, joined: "2026-02-05", vat: "IT12345678901", email: "info@pvdirect.it", status: "active" },
  { id: 5, name: "PV Express FR", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", products: 31, revenue: 53500, commission: 2541.25, kyc: "verified", tier: "silver", rating: 4.4, joined: "2026-02-10", vat: "FR98765432101", email: "pro@pvexpress.fr", status: "active" },
  { id: 6, name: "SunPower ES", country: "ES", flag: "\u{1F1EA}\u{1F1F8}", products: 28, revenue: 13750, commission: 653.13, kyc: "pending", tier: "bronze", rating: 4.1, joined: "2026-02-15", vat: "ESA12345678", email: "ventas@sunpower.es", status: "active" },
  { id: 7, name: "SunParts BE", country: "BE", flag: "\u{1F1E7}\u{1F1EA}", products: 38, revenue: 27600, commission: 1311, kyc: "verified", tier: "silver", rating: 4.5, joined: "2026-02-03", vat: "BE0123456789", email: "info@sunparts.be", status: "active" },
  { id: 8, name: "AlpenSolar AT", country: "AT", flag: "\u{1F1E6}\u{1F1F9}", products: 19, revenue: 9500, commission: 451.25, kyc: "pending_review", tier: "bronze", rating: 0, joined: "2026-02-18", vat: "ATU12345678", email: "office@alpensolar.at", status: "active" },
  { id: 9, name: "Nordic Solar ApS", country: "DK", flag: "\u{1F1E9}\u{1F1F0}", products: 14, revenue: 14400, commission: 684, kyc: "verified", tier: "bronze", rating: 4.2, joined: "2026-02-12", vat: "DK12345678", email: "hello@nordicsolar.dk", status: "active" },
  { id: 10, name: "LuxSun SARL", country: "LU", flag: "\u{1F1F1}\u{1F1FA}", products: 8, revenue: 0, commission: 0, kyc: "pending", tier: "none", rating: 0, joined: "2026-02-25", vat: "LU12345678", email: "contact@luxsun.lu", status: "active" },
  { id: 11, name: "PolEnergy Sp.z.o.o", country: "PL", flag: "\u{1F1F5}\u{1F1F1}", products: 22, revenue: 11400, commission: 541.50, kyc: "verified", tier: "bronze", rating: 4.0, joined: "2026-02-08", vat: "PL1234567890", email: "biuro@polenergy.pl", status: "active" },
  { id: 12, name: "SolarTech Lda", country: "PT", flag: "\u{1F1F5}\u{1F1F9}", products: 0, revenue: 0, commission: 0, kyc: "rejected", tier: "none", rating: 0, joined: "2026-03-01", vat: "PT123456789", email: "geral@solartech.pt", status: "suspended" },
];

const MOCK_MONTHLY = [
  { label: "Avr 2025", value: 0 }, { label: "Mai 2025", value: 0 },
  { label: "Jun 2025", value: 0 }, { label: "Jul 2025", value: 0 },
  { label: "Aoû 2025", value: 12400 }, { label: "Sep 2025", value: 28600 },
  { label: "Oct 2025", value: 35200 }, { label: "Nov 2025", value: 41800 },
  { label: "Déc 2025", value: 52100 }, { label: "Jan 2026", value: 78200 },
  { label: "Fév 2026", value: 142450 }, { label: "Mar 2026", value: 96570 },
];

const MOCK_REGISTRATIONS = [
  { id: "REG-041", companyName: "SolairePlus SARL", contactName: "Marc Dupont", email: "m.dupont@solaireplus.fr", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", role: "seller", vatNumber: "FR67890123456", date: "2026-03-03", status: "pending_review" },
  { id: "REG-040", companyName: "Energix GmbH", contactName: "Klaus Weber", email: "k.weber@energix.de", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", role: "seller", vatNumber: "DE987654321", date: "2026-03-02", status: "pending_review" },
  { id: "REG-039", companyName: "Pannelli Italia Srl", contactName: "Marco Rossi", email: "m.rossi@pannellitalia.it", country: "IT", flag: "\u{1F1EE}\u{1F1F9}", role: "both", vatNumber: "IT98765432101", date: "2026-03-01", status: "pending_review" },
  { id: "REG-038", companyName: "ZonnePaneel BV", contactName: "Jan de Vries", email: "j.devries@zonnepaneel.nl", country: "NL", flag: "\u{1F1F3}\u{1F1F1}", role: "buyer", vatNumber: "NL987654321B01", date: "2026-02-28", status: "info_requested" },
  { id: "REG-037", companyName: "SolTech Polska", contactName: "Anna Kowalski", email: "a.kowalski@soltech.pl", country: "PL", flag: "\u{1F1F5}\u{1F1F1}", role: "seller", vatNumber: "PL9876543210", date: "2026-02-27", status: "pending_review" },
  { id: "REG-036", companyName: "HélioSud SARL", contactName: "Pierre Martin", email: "p.martin@heliosud.fr", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", role: "seller", vatNumber: "FR11223344556", date: "2026-02-25", status: "approved" },
  { id: "REG-035", companyName: "Nordic Green ApS", contactName: "Lars Andersen", email: "l.andersen@nordicgreen.dk", country: "DK", flag: "\u{1F1E9}\u{1F1F0}", role: "buyer", vatNumber: "DK98765432", date: "2026-02-23", status: "approved" },
  { id: "REG-034", companyName: "FakeSolar Ltd", contactName: "John Doe", email: "info@fakesolar.com", country: "GB", flag: "\u{1F1EC}\u{1F1E7}", role: "seller", vatNumber: "GB000000000", date: "2026-02-20", status: "rejected" },
];

const MOCK_USERS = [
  { id: "u-001", name: "Pierre Lefèvre", email: "p.lefevre@solarpro.fr", company: "SolarPro France", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", role: "buyer", kycStatus: "verified", lastActive: "2026-03-03", status: "active" },
  { id: "u-002", name: "Hans Müller", email: "h.muller@greentech.de", company: "GreenTech Berlin", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", role: "buyer", kycStatus: "verified", lastActive: "2026-03-03", status: "active" },
  { id: "u-003", name: "Yohan Aboujdid", email: "yohan.d@qualiwatt.com", company: "QUALIWATT", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", role: "both", kycStatus: "verified", lastActive: "2026-03-04", status: "active" },
  { id: "u-004", name: "Carlos Ruiz", email: "c.ruiz@volta.es", company: "Volta Instaladores", country: "ES", flag: "\u{1F1EA}\u{1F1F8}", role: "buyer", kycStatus: "verified", lastActive: "2026-03-02", status: "active" },
  { id: "u-005", name: "Jan van der Berg", email: "j.berg@nlsolar.nl", company: "NL Solar BV", country: "NL", flag: "\u{1F1F3}\u{1F1F1}", role: "buyer", kycStatus: "verified", lastActive: "2026-03-02", status: "active" },
  { id: "u-006", name: "Luca Bianchi", email: "l.bianchi@italiasolar.it", company: "Italia Solar Srl", country: "IT", flag: "\u{1F1EE}\u{1F1F9}", role: "buyer", kycStatus: "verified", lastActive: "2026-03-01", status: "active" },
  { id: "u-007", name: "Sophie Lambert", email: "s.lambert@belsol.be", company: "BelSol SPRL", country: "BE", flag: "\u{1F1E7}\u{1F1EA}", role: "buyer", kycStatus: "verified", lastActive: "2026-03-01", status: "active" },
  { id: "u-008", name: "Thomas Schmidt", email: "t.schmidt@solarmax.de", company: "SolarMax DE", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", role: "seller", kycStatus: "verified", lastActive: "2026-03-03", status: "active" },
  { id: "u-009", name: "Erik Jansen", email: "e.jansen@energyparts.nl", company: "EnergyParts NL", country: "NL", flag: "\u{1F1F3}\u{1F1F1}", role: "seller", kycStatus: "verified", lastActive: "2026-03-02", status: "active" },
  { id: "u-010", name: "Alessandro Conti", email: "a.conti@pvdirect.it", company: "PV Direct IT", country: "IT", flag: "\u{1F1EE}\u{1F1F9}", role: "seller", kycStatus: "verified", lastActive: "2026-02-28", status: "active" },
  { id: "u-011", name: "François Moreau", email: "f.moreau@pvexpress.fr", company: "PV Express FR", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", role: "seller", kycStatus: "verified", lastActive: "2026-03-01", status: "active" },
  { id: "u-012", name: "Miguel Torres", email: "m.torres@sunpower.es", company: "SunPower ES", country: "ES", flag: "\u{1F1EA}\u{1F1F8}", role: "seller", kycStatus: "pending", lastActive: "2026-02-20", status: "active" },
  { id: "u-013", name: "Stefan Hofer", email: "s.hofer@alpensolar.at", company: "AlpenSolar AT", country: "AT", flag: "\u{1F1E6}\u{1F1F9}", role: "seller", kycStatus: "pending_review", lastActive: "2026-02-18", status: "active" },
  { id: "u-014", name: "Marc Dupont", email: "m.dupont@solaireplus.fr", company: "SolairePlus SARL", country: "FR", flag: "\u{1F1EB}\u{1F1F7}", role: "seller", kycStatus: "pending_review", lastActive: "2026-03-03", status: "pending" },
  { id: "u-015", name: "Klaus Weber", email: "k.weber@energix.de", company: "Energix GmbH", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", role: "seller", kycStatus: "pending_review", lastActive: "2026-03-02", status: "pending" },
  { id: "u-016", name: "John Doe", email: "info@fakesolar.com", company: "FakeSolar Ltd", country: "GB", flag: "\u{1F1EC}\u{1F1E7}", role: "seller", kycStatus: "rejected", lastActive: "2026-02-20", status: "suspended" },
  { id: "u-017", name: "Hugo Fernandes", email: "h.fernandes@solartech.pt", company: "SolarTech Lda", country: "PT", flag: "\u{1F1F5}\u{1F1F9}", role: "seller", kycStatus: "rejected", lastActive: "2026-02-15", status: "suspended" },
];

const MOCK_DELIVERIES = [
  { id: "DEL-087", orderId: "ST-3012", buyer: "SolarPro France", seller: "QUALIWATT", product: "Huawei SUN2000-10KTL-M2", status: "in_transit", origin: "Lyon, FR", destination: "Paris, FR", flag: "\u{1F1EB}\u{1F1F7}", estimatedDelivery: "2026-03-05" },
  { id: "DEL-086", orderId: "ST-3009", buyer: "NL Solar BV", seller: "EnergyParts NL", product: "Hoymiles HMS-2000-4T", status: "in_transit", origin: "Amsterdam, NL", destination: "Rotterdam, NL", flag: "\u{1F1F3}\u{1F1F1}", estimatedDelivery: "2026-03-04" },
  { id: "DEL-085", orderId: "ST-3003", buyer: "MéridienSolar", seller: "QUALIWATT", product: "BYD HVS 12.8 kWh", status: "in_transit", origin: "Lyon, FR", destination: "Marseille, FR", flag: "\u{1F1EB}\u{1F1F7}", estimatedDelivery: "2026-03-04" },
  { id: "DEL-084", orderId: "ST-3010", buyer: "Volta Instaladores", seller: "QUALIWATT", product: "Huawei LUNA2000-10-S0", status: "delivered", origin: "Lyon, FR", destination: "Madrid, ES", flag: "\u{1F1EA}\u{1F1F8}", estimatedDelivery: "2026-03-01" },
  { id: "DEL-083", orderId: "ST-3007", buyer: "BelSol SPRL", seller: "QUALIWATT", product: "Huawei SUN2000-5KTL-M1", status: "delivered", origin: "Lyon, FR", destination: "Bruxelles, BE", flag: "\u{1F1E7}\u{1F1EA}", estimatedDelivery: "2026-02-28" },
  { id: "DEL-082", orderId: "ST-3008", buyer: "Italia Solar Srl", seller: "PV Direct IT", product: "Jinko Tiger Neo 580W", status: "issue", origin: "Milano, IT", destination: "Roma, IT", flag: "\u{1F1EE}\u{1F1F9}", estimatedDelivery: "2026-02-28" },
];

const MOCK_DISPUTES = [
  { id: "DIS-012", orderId: "ST-3008", buyer: "Italia Solar Srl", seller: "PV Direct IT", reason: "Produit endommagé à la réception (3 panneaux fissurés sur 100)", amount: 690, status: "open", date: "2026-03-01", flag: "\u{1F1EE}\u{1F1F9}" },
  { id: "DIS-011", orderId: "ST-2980", buyer: "Helia GmbH", seller: "SunPower ES", reason: "Quantité livrée inférieure à la commande (23/25 onduleurs)", amount: 1100, status: "open", date: "2026-02-24", flag: "\u{1F1E9}\u{1F1EA}" },
  { id: "DIS-010", orderId: "ST-2967", buyer: "EcoSol s.r.o.", seller: "PolEnergy PL", reason: "Mauvaise référence livrée (Growatt MIN 5000 au lieu de 6000)", amount: 850, status: "open", date: "2026-02-18", flag: "\u{1F1E8}\u{1F1FF}" },
  { id: "DIS-009", orderId: "ST-2945", buyer: "SolarPro France", seller: "PV Express FR", reason: "Retard de livraison > 15 jours", amount: 0, status: "resolved", date: "2026-02-10", flag: "\u{1F1EB}\u{1F1F7}" },
  { id: "DIS-008", orderId: "ST-2930", buyer: "Nordic Solar ApS", seller: "EnergyParts NL", reason: "Documentation technique manquante", amount: 0, status: "resolved", date: "2026-02-05", flag: "\u{1F1E9}\u{1F1F0}" },
];

const MOCK_DATA = {
  kpi: MOCK_KPI,
  transactions: MOCK_TRANSACTIONS,
  sellers: MOCK_SELLERS,
  monthlyRevenue: MOCK_MONTHLY,
  registrations: MOCK_REGISTRATIONS,
  users: MOCK_USERS,
  deliveries: MOCK_DELIVERIES,
  disputes: MOCK_DISPUTES,
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
        // Merge server data with client-only mock collections (registrations, users, deliveries, disputes)
        // until those endpoints are implemented server-side
        setData({
          ...MOCK_DATA,
          ...result,
        });
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
export { MOCK_DATA, MOCK_KPI, MOCK_TRANSACTIONS, MOCK_SELLERS, MOCK_MONTHLY, MOCK_REGISTRATIONS, MOCK_USERS, MOCK_DELIVERIES, MOCK_DISPUTES };
