'use strict';

/**
 * SUNTREX — Fraud Detection API
 *
 * POST /api/fraud/check-duplicate  — Detect duplicate accounts
 * POST /api/fraud/check-pricing    — Detect abnormal pricing
 *
 * Both endpoints require admin authentication.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Simple admin auth check via Authorization header
async function verifyAdmin(request, reply) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing authorization' });
    return false;
  }
  const token = auth.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    reply.code(401).send({ error: 'Invalid token' });
    return false;
  }
  // Check admin role in User table
  const { data: userRow } = await supabase
    .from('User')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (!userRow || userRow.role !== 'admin') {
    reply.code(403).send({ error: 'Admin access required' });
    return false;
  }
  return true;
}

module.exports = async function (fastify) {

  /**
   * POST /api/fraud/check-duplicate
   *
   * Detects potential duplicate accounts by matching:
   * - Same phone number
   * - Same VAT / SIRET
   * - Same address
   * - Same IP at registration (if tracked)
   *
   * Returns risk score 0-100 and matched fields.
   */
  fastify.post('/fraud/check-duplicate', async (request, reply) => {
    const ok = await verifyAdmin(request, reply);
    if (!ok) return;

    const { userId } = request.body || {};
    if (!userId) {
      return reply.code(400).send({ error: 'userId required' });
    }

    // Get user + company info
    const { data: user } = await supabase
      .from('User')
      .select('id, email, phone, registration_ip, company_id')
      .eq('id', userId)
      .single();

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const { data: company } = user.company_id
      ? await supabase.from('Company').select('*').eq('id', user.company_id).single()
      : { data: null };

    const matches = [];
    let score = 0;

    // Check phone duplicates
    if (user.phone) {
      const { data: phoneMatches } = await supabase
        .from('User')
        .select('id, email, phone')
        .eq('phone', user.phone)
        .neq('id', userId);
      if (phoneMatches && phoneMatches.length > 0) {
        matches.push({ field: 'phone', value: user.phone, matchedUsers: phoneMatches.map(u => u.id) });
        score += 30;
      }
    }

    // Check VAT number duplicates
    if (company && company.vat_number) {
      const { data: vatMatches } = await supabase
        .from('Company')
        .select('id, name, vat_number')
        .eq('vat_number', company.vat_number)
        .neq('id', company.id);
      if (vatMatches && vatMatches.length > 0) {
        matches.push({ field: 'vat_number', value: company.vat_number, matchedCompanies: vatMatches.map(c => c.id) });
        score += 40;
      }
    }

    // Check address duplicates
    if (company && company.address) {
      const { data: addrMatches } = await supabase
        .from('Company')
        .select('id, name, address')
        .eq('address', company.address)
        .neq('id', company.id);
      if (addrMatches && addrMatches.length > 0) {
        matches.push({ field: 'address', value: company.address, matchedCompanies: addrMatches.map(c => c.id) });
        score += 20;
      }
    }

    // Check registration IP duplicates
    if (user.registration_ip) {
      const { data: ipMatches } = await supabase
        .from('User')
        .select('id, email, registration_ip')
        .eq('registration_ip', user.registration_ip)
        .neq('id', userId);
      if (ipMatches && ipMatches.length > 0) {
        matches.push({ field: 'registration_ip', value: user.registration_ip, matchedUsers: ipMatches.map(u => u.id) });
        score += 25;
      }
    }

    score = Math.min(100, score);
    const status = score >= 60 ? 'high_risk' : score >= 30 ? 'medium_risk' : 'low_risk';

    return {
      userId,
      score,
      status,
      matches,
      checkedAt: new Date().toISOString(),
    };
  });

  /**
   * POST /api/fraud/check-pricing
   *
   * Detects abnormal pricing on a listing:
   * - Price > 50% above market average → 'overpriced'
   * - Price < 30% below market average → 'suspicious' (possible scam)
   *
   * Returns score + reason.
   */
  fastify.post('/fraud/check-pricing', async (request, reply) => {
    const ok = await verifyAdmin(request, reply);
    if (!ok) return;

    const { listingId, price, category, brand } = request.body || {};
    if (!price || !category) {
      return reply.code(400).send({ error: 'price and category required' });
    }

    // Get similar listings from DB
    let query = supabase
      .from('Listing')
      .select('id, product_name, price, seller_company_id')
      .eq('category', category)
      .gt('price', 0);

    if (brand) query = query.eq('brand', brand);
    if (listingId) query = query.neq('id', listingId);

    const { data: similar } = await query;

    // If not enough DB data, return neutral
    if (!similar || similar.length < 3) {
      return {
        listingId: listingId || null,
        price,
        score: 0,
        status: 'insufficient_data',
        reason: 'Not enough comparable listings to evaluate pricing',
        marketData: null,
      };
    }

    const prices = similar.map(l => l.price);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    const diffPct = ((price - avg) / avg) * 100;
    let score = 0;
    let status = 'normal';
    let reason = '';

    if (diffPct > 50) {
      score = Math.min(100, Math.round(diffPct));
      status = 'overpriced';
      reason = `Price is ${Math.round(diffPct)}% above market average (avg: ${Math.round(avg)} EUR). Potential overpricing.`;
    } else if (diffPct < -30) {
      score = Math.min(100, Math.round(Math.abs(diffPct)));
      status = 'suspicious';
      reason = `Price is ${Math.round(Math.abs(diffPct))}% below market average (avg: ${Math.round(avg)} EUR). Suspiciously low — possible scam.`;
    } else if (diffPct > 20) {
      score = 25;
      status = 'slightly_high';
      reason = `Price is ${Math.round(diffPct)}% above average. Within acceptable range but high.`;
    } else if (diffPct < -15) {
      score = 20;
      status = 'slightly_low';
      reason = `Price is ${Math.round(Math.abs(diffPct))}% below average. Competitive but monitor.`;
    }

    return {
      listingId: listingId || null,
      price,
      score,
      status,
      reason,
      marketData: {
        avg: Math.round(avg),
        min: Math.round(min),
        max: Math.round(max),
        sampleSize: similar.length,
      },
      checkedAt: new Date().toISOString(),
    };
  });
};
