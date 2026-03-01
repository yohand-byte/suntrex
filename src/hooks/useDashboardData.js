/**
 * SUNTREX — useDashboardData Hook
 *
 * Replaces MOCK_BUYER / MOCK_SELLER with real Supabase queries.
 * Falls back to mock data gracefully when tables are empty or user is not authenticated.
 *
 * Tables used:
 *   profiles, companies, listings, transactions, transaction_items,
 *   messages, rfqs, quotes, transaction_events
 *
 * All queries respect RLS — user only sees their own data.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_BUYER, MOCK_SELLER } from '../components/dashboard/dashboardUtils';

// ── Buyer data fetcher ─────────────────────────────────────────
async function fetchBuyerData(userId) {
  const [profileRes, ordersRes, rfqsRes] = await Promise.all([
    supabase.from('profiles').select('*, companies(*)').eq('id', userId).single(),
    supabase.from('transactions').select('*, transaction_items(*), seller:profiles!transactions_seller_id_fkey(company_name)').eq('buyer_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('rfqs').select('*, quotes(count)').eq('buyer_id', userId).order('created_at', { ascending: false }).limit(10),
  ]);

  const profile = profileRes.data;
  const orders = (ordersRes.data || []).map(tx => ({
    id: tx.id,
    shortId: tx.id.substring(0, 8),
    date: tx.created_at,
    status: tx.status,
    product: tx.transaction_items?.map(i => i.product_name + ' ×' + i.qty).join(', ') || '-',
    seller: tx.seller?.company_name || '-',
    amount: Number(tx.total_amount),
    tracking: tx.id,
  }));
  const rfqs = (rfqsRes.data || []).map(r => ({
    id: r.id,
    product: r.title,
    qty: r.qty,
    status: r.status,
    quotes: r.quotes?.[0]?.count || 0,
    deadline: r.deadline_at,
  }));

  const company = profile?.companies;
  const totalSpend = orders.reduce((s, o) => s + o.amount, 0);

  return {
    user: {
      name: profile?.company_name || 'Utilisateur',
      email: '',
      avatar: (profile?.company_name || 'U').substring(0, 2).toUpperCase(),
      role: profile?.role || 'buyer',
      verified: profile?.kyc_status === 'verified',
    },
    company: {
      name: company?.legal_name || profile?.company_name || '',
      vat: company?.vat_number || profile?.vat_number || '',
      country: profile?.country_code || 'FR',
      type: profile?.role === 'seller' ? 'Distributeur' : 'Installateur',
    },
    stats: {
      totalOrders: orders.length,
      totalSpend,
      pendingOrders: orders.filter(o => ['negotiation', 'confirmed', 'paid'].includes(o.status)).length,
      savedItems: 0,
      activeRFQs: rfqs.filter(r => r.status === 'open').length,
      avgOrderValue: orders.length > 0 ? Math.round(totalSpend / orders.length) : 0,
    },
    orders,
    rfqs,
    saved: [],
    notifications: [],
  };
}

// ── Seller data fetcher ────────────────────────────────────────
async function fetchSellerData(userId) {
  const [profileRes, companyRes, listingsRes, ordersRes, payoutsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('companies').select('*').eq('owner_user_id', userId).single(),
    supabase.from('listings').select('*').eq('seller_id', userId).order('created_at', { ascending: false }),
    supabase.from('transactions').select('*, transaction_items(*), buyer:profiles!transactions_buyer_id_fkey(company_name, country_code)').eq('seller_id', userId).order('created_at', { ascending: false }).limit(20),
    // No payouts table yet — will come from Stripe API later
    Promise.resolve({ data: [] }),
  ]);

  const profile = profileRes.data;
  const company = companyRes.data;
  const listings = (listingsRes.data || []).map(l => ({
    id: l.id,
    sku: l.sku,
    name: l.title,
    price: Number(l.unit_price),
    stock: l.stock,
    status: l.status === 'active' ? 'active' : l.stock === 0 ? 'soldout' : l.status,
    views: 0,
    orders: 0,
  }));
  const orders = (ordersRes.data || []).map(tx => {
    const subtotal = Number(tx.subtotal_amount);
    const fee = Math.round(subtotal * 0.05 * 100) / 100; // 5% commission estimate
    return {
      id: tx.id,
      shortId: tx.id.substring(0, 8),
      date: tx.created_at,
      status: tx.status,
      buyer: tx.buyer?.company_name || '-',
      product: tx.transaction_items?.map(i => i.product_name + ' ×' + i.qty).join(', ') || '-',
      amount: subtotal,
      fee,
      net: subtotal - fee,
    };
  });

  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
  const stripeStatus = company?.stripe_charges_enabled && company?.stripe_payouts_enabled
    ? 'active'
    : company?.stripe_account_id
      ? 'pending'
      : 'not_started';

  return {
    user: {
      name: profile?.company_name || 'Vendeur',
      email: '',
      avatar: (profile?.company_name || 'V').substring(0, 2).toUpperCase(),
      role: profile?.role || 'seller',
      verified: profile?.kyc_status === 'verified',
    },
    company: {
      name: company?.legal_name || profile?.company_name || '',
      vat: company?.vat_number || profile?.vat_number || '',
      country: profile?.country_code || 'DE',
      type: 'Distributeur',
    },
    stripeStatus,
    stats: {
      totalRevenue,
      monthRevenue: totalRevenue, // Simplified — filter by month later
      pendingPayouts: 0,
      activeListings: listings.filter(l => l.status === 'active').length,
      totalOrders: orders.length,
      conversionRate: 0,
      avgRating: Number(profile?.rating) || 0,
      totalReviews: profile?.rating_count || 0,
      responseTime: profile?.avg_response_time_minutes
        ? (profile.avg_response_time_minutes < 60 ? '< 1h' : '< ' + Math.ceil(profile.avg_response_time_minutes / 60) + 'h')
        : 'N/A',
    },
    monthlyRevenue: [],
    orders,
    listings,
    payouts: [],
    notifications: [],
  };
}

// ── Main Hook ──────────────────────────────────────────────────
export function useDashboardData(role = 'buyer') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = role === 'seller'
        ? await fetchSellerData(user.id)
        : await fetchBuyerData(user.id);

      // Check if we got real data (at least profile loaded)
      if (result.user.name && result.user.name !== 'Utilisateur' && result.user.name !== 'Vendeur') {
        setData(result);
        setUsingMock(false);
      } else {
        // User exists but no data yet — use mock for demo
        setData(role === 'seller' ? MOCK_SELLER : MOCK_BUYER);
        setUsingMock(true);
      }
    } catch (err) {
      console.warn('[useDashboardData] Falling back to mock:', err.message);
      setData(role === 'seller' ? MOCK_SELLER : MOCK_BUYER);
      setUsingMock(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, usingMock, refresh };
}
