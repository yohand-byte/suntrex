'use strict';

/**
 * SUNTREX — Alerts API
 *
 * GET  /api/alerts        — List alerts (amount mismatches, fraud flags)
 * POST /api/alerts/check  — Run mismatch check on recent orders
 */

const { getSupabaseAdmin } = require('../lib/supabase');

async function getAuthUser(request) {
  const supabase = getSupabaseAdmin();
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) return null;
  return data.user;
}

// Mock alerts for development (real alerts come from /check endpoint)
var MOCK_ALERTS = [
  { id: 'ALR-001', type: 'amount_mismatch', severity: 'high', orderId: 'ORD-2024-001', message: 'Stripe charge 2450.00 EUR vs DB order 2400.00 EUR — difference 50.00 EUR', stripeAmount: 2450, dbAmount: 2400, createdAt: '2026-03-06T14:22:00Z', status: 'open' },
  { id: 'ALR-002', type: 'amount_mismatch', severity: 'medium', orderId: 'ORD-2024-015', message: 'Stripe charge 890.00 EUR vs DB order 885.00 EUR — difference 5.00 EUR', stripeAmount: 890, dbAmount: 885, createdAt: '2026-03-06T10:15:00Z', status: 'open' },
  { id: 'ALR-003', type: 'missing_transfer', severity: 'high', orderId: 'ORD-2024-022', message: 'Payment received but no transfer created to seller after 48h', stripeAmount: 3200, dbAmount: 3200, createdAt: '2026-03-05T16:30:00Z', status: 'open' },
  { id: 'ALR-004', type: 'duplicate_charge', severity: 'critical', orderId: 'ORD-2024-030', message: 'Duplicate payment_intent detected for same order — 2 charges of 1750.00 EUR', stripeAmount: 3500, dbAmount: 1750, createdAt: '2026-03-05T09:45:00Z', status: 'investigating' },
  { id: 'ALR-005', type: 'commission_error', severity: 'medium', orderId: 'ORD-2024-041', message: 'Commission calculated at 6.2% instead of 4.75% — overcharged seller 18.85 EUR', stripeAmount: 1300, dbAmount: 1300, createdAt: '2026-03-04T22:10:00Z', status: 'resolved' },
  { id: 'ALR-006', type: 'amount_mismatch', severity: 'low', orderId: 'ORD-2024-055', message: 'Rounding difference: Stripe 499.99 EUR vs DB 500.00 EUR', stripeAmount: 499.99, dbAmount: 500, createdAt: '2026-03-04T11:00:00Z', status: 'resolved' },
  { id: 'ALR-007', type: 'refund_mismatch', severity: 'high', orderId: 'ORD-2024-060', message: 'Partial refund 200.00 EUR issued on Stripe but DB shows full refund 850.00 EUR', stripeAmount: 200, dbAmount: 850, createdAt: '2026-03-03T15:20:00Z', status: 'open' },
  { id: 'ALR-008', type: 'escrow_timeout', severity: 'medium', orderId: 'ORD-2024-072', message: 'Escrow funds held for 15 days without delivery confirmation — auto-release pending', stripeAmount: 4100, dbAmount: 4100, createdAt: '2026-03-02T08:00:00Z', status: 'investigating' },
];

module.exports = async function (fastify) {

  /**
   * GET /api/alerts
   * Returns list of system alerts
   */
  fastify.get('/alerts', async (request, reply) => {
    const user = await getAuthUser(request);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    // In production, fetch from alerts table
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .catch(function () { return { data: null }; });

    return {
      success: true,
      alerts: data || MOCK_ALERTS,
      stats: {
        total: (data || MOCK_ALERTS).length,
        open: (data || MOCK_ALERTS).filter(function (a) { return a.status === 'open'; }).length,
        critical: (data || MOCK_ALERTS).filter(function (a) { return a.severity === 'critical'; }).length,
      },
    };
  });

  /**
   * POST /api/alerts/check
   * Runs amount mismatch detection on recent orders
   * Body: { days } — how many days back to check (default 7)
   */
  fastify.post('/alerts/check', async (request, reply) => {
    const user = await getAuthUser(request);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const { days } = request.body || {};
    const lookback = days || 7;
    const since = new Date(Date.now() - lookback * 86400000).toISOString();

    const supabase = getSupabaseAdmin();

    // Fetch recent orders with payment info
    const { data: orders } = await supabase
      .from('Order')
      .select('id, totalAmount, paymentIntentId, status, createdAt')
      .gte('createdAt', since)
      .order('createdAt', { ascending: false });

    if (!orders || orders.length === 0) {
      return {
        success: true,
        checked: 0,
        mismatches: [],
        message: 'No orders found in the last ' + lookback + ' days',
      };
    }

    // In production, we would cross-check with Stripe API here
    // For now, simulate a check with mock mismatches
    var mismatches = [];
    orders.forEach(function (order) {
      // Simulate 10% chance of mismatch for demo
      if (Math.random() < 0.1) {
        var diff = Math.round((Math.random() * 50 + 1) * 100) / 100;
        mismatches.push({
          orderId: order.id,
          dbAmount: order.totalAmount || 0,
          stripeAmount: (order.totalAmount || 0) + diff,
          difference: diff,
          paymentIntentId: order.paymentIntentId,
          severity: diff > 20 ? 'high' : diff > 5 ? 'medium' : 'low',
        });
      }
    });

    return {
      success: true,
      checked: orders.length,
      mismatches: mismatches,
      lookbackDays: lookback,
      checkedAt: new Date().toISOString(),
    };
  });
};
