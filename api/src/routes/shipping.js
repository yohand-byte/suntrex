'use strict';

/**
 * SUNTREX — Shipping API
 *
 * POST /api/shipping/rates  — Get carrier rates for a shipment
 * POST /api/shipping/track  — Track a parcel by tracking number
 * POST /api/shipping/book   — Book a pickup with a carrier
 */

const { getSupabaseAdmin } = require('../lib/supabase');

// Carrier definitions with base pricing
const CARRIERS = {
  dpd: {
    name: 'DPD',
    logo: 'https://img.icons8.com/color/96/dpd.png',
    basePrice: 8.50,
    pricePerKg: 0.45,
    pricePerKm: 0.012,
    minDays: 2,
    maxDays: 5,
    maxWeight: 31.5,
    trackingPrefix: 'DPD',
  },
  gls: {
    name: 'GLS',
    logo: 'https://img.icons8.com/color/96/gls.png',
    basePrice: 7.90,
    pricePerKg: 0.50,
    pricePerKm: 0.014,
    minDays: 2,
    maxDays: 6,
    maxWeight: 40,
    trackingPrefix: 'GLS',
  },
  dbschenker: {
    name: 'DB Schenker',
    logo: 'https://img.icons8.com/color/96/db-schenker.png',
    basePrice: 15.00,
    pricePerKg: 0.35,
    pricePerKm: 0.010,
    minDays: 3,
    maxDays: 7,
    maxWeight: 2500,
    trackingPrefix: 'DBK',
  },
};

// Simplified distance matrix between EU countries (km)
const DISTANCES = {
  'FR-DE': 800, 'FR-BE': 300, 'FR-NL': 500, 'FR-IT': 1100, 'FR-ES': 1000,
  'DE-BE': 600, 'DE-NL': 400, 'DE-IT': 1000, 'DE-ES': 1800, 'DE-FR': 800,
  'BE-NL': 200, 'BE-IT': 1200, 'BE-ES': 1400, 'BE-FR': 300, 'BE-DE': 600,
  'NL-IT': 1300, 'NL-ES': 1600, 'NL-FR': 500, 'NL-DE': 400, 'NL-BE': 200,
  'IT-ES': 1500, 'IT-FR': 1100, 'IT-DE': 1000, 'IT-BE': 1200, 'IT-NL': 1300,
  'ES-FR': 1000, 'ES-DE': 1800, 'ES-BE': 1400, 'ES-NL': 1600, 'ES-IT': 1500,
};

function getDistance(origin, destination) {
  if (origin === destination) return 50; // domestic
  const key1 = origin + '-' + destination;
  const key2 = destination + '-' + origin;
  return DISTANCES[key1] || DISTANCES[key2] || 1000;
}

function generateMockTracking(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getAuthUser(request) {
  const supabase = getSupabaseAdmin();
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) return null;
  return data.user;
}

module.exports = async function (fastify) {

  /**
   * POST /api/shipping/rates
   * Body: { weight, length, width, height, origin, destination }
   * origin/destination: ISO country code (FR, DE, BE, NL, IT, ES)
   */
  fastify.post('/shipping/rates', async (request, reply) => {
    const user = await getAuthUser(request);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const { weight, length, width, height, origin, destination } = request.body || {};

    const w = weight || 10;
    const dist = getDistance((origin || 'FR').toUpperCase(), (destination || 'DE').toUpperCase());

    // Volumetric weight: L*W*H / 5000
    const volWeight = (length && width && height) ? (length * width * height) / 5000 : w;
    const billableWeight = Math.max(w, volWeight);

    const carriers = Object.values(CARRIERS).map(function (c) {
      if (billableWeight > c.maxWeight) {
        return { name: c.name, logo: c.logo, available: false, reason: 'Max weight ' + c.maxWeight + ' kg exceeded' };
      }

      const price = Math.round((c.basePrice + billableWeight * c.pricePerKg + dist * c.pricePerKm) * 100) / 100;
      const estimatedDays = c.minDays + Math.floor(dist / 500);
      const clampedDays = Math.min(estimatedDays, c.maxDays);

      return {
        name: c.name,
        logo: c.logo,
        available: true,
        price: price,
        currency: 'EUR',
        estimatedDays: clampedDays,
        trackingUrl: 'https://tracking.suntrex.eu/' + c.trackingPrefix.toLowerCase(),
        maxWeight: c.maxWeight,
      };
    });

    return {
      origin: (origin || 'FR').toUpperCase(),
      destination: (destination || 'DE').toUpperCase(),
      weight: billableWeight,
      distance: dist,
      carriers: carriers,
    };
  });

  /**
   * POST /api/shipping/track
   * Body: { trackingNumber }
   */
  fastify.post('/shipping/track', async (request, reply) => {
    const user = await getAuthUser(request);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const { trackingNumber } = request.body || {};
    if (!trackingNumber) return reply.code(400).send({ error: 'trackingNumber required' });

    // Try to find in delivery_tracking table
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single();

    if (data) {
      return {
        found: true,
        trackingNumber: data.tracking_number,
        carrier: data.carrier,
        status: data.status,
        steps: typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // Mock response for unknown tracking numbers
    const now = new Date();
    return {
      found: true,
      trackingNumber: trackingNumber,
      carrier: trackingNumber.startsWith('DPD') ? 'DPD' : trackingNumber.startsWith('GLS') ? 'GLS' : 'DB Schenker',
      status: 'in_transit',
      events: [
        { date: new Date(now - 2 * 86400000).toISOString(), status: 'picked_up', location: 'Warehouse Paris, FR' },
        { date: new Date(now - 86400000).toISOString(), status: 'in_transit', location: 'Hub Frankfurt, DE' },
        { date: now.toISOString(), status: 'out_for_delivery', location: 'Munich, DE' },
      ],
    };
  });

  /**
   * POST /api/shipping/book
   * Body: { orderId, carrier, pickupDate, pickupAddress }
   */
  fastify.post('/shipping/book', async (request, reply) => {
    const user = await getAuthUser(request);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });

    const { orderId, carrier, pickupDate, pickupAddress } = request.body || {};
    if (!orderId || !carrier) return reply.code(400).send({ error: 'orderId and carrier required' });

    const carrierDef = CARRIERS[carrier.toLowerCase().replace(/\s+/g, '')] || CARRIERS.dpd;
    const trackingNumber = generateMockTracking(carrierDef.trackingPrefix);

    // Store in DB
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    await supabase.from('delivery_tracking').insert({
      order_id: orderId,
      tracking_number: trackingNumber,
      carrier: carrierDef.name,
      status: 'booked',
      steps: JSON.stringify({
        seller_dispatch: { completedAt: null, photoUrl: null, gps: null },
        pickup_inspection: { completedAt: null, photoUrl: null, gps: null },
        in_transit: { completedAt: null, photoUrl: null, gps: null },
        delivery_confirmation: { completedAt: null, photoUrl: null, gps: null },
      }),
      created_at: now,
      updated_at: now,
    }).catch(function () { /* table may not exist */ });

    return {
      success: true,
      booking: {
        trackingNumber: trackingNumber,
        carrier: carrierDef.name,
        status: 'booked',
        pickupDate: pickupDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        pickupAddress: pickupAddress || 'Address on file',
        estimatedDelivery: new Date(Date.now() + carrierDef.maxDays * 86400000).toISOString().slice(0, 10),
      },
    };
  });
};
