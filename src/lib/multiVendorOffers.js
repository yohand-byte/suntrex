/**
 * SUNTREX — Multi-Vendor Offer Generator v2
 *
 * Enhanced with:
 * - Seller Tier System (Platinum/Gold/Silver/Bronze)
 * - SUNTREX Trust Badges (verified, escrow, colisVerif, delivery, response)
 * - Country filtering support
 * - Comparison drawer data
 *
 * In production, replaced by Supabase listings + profiles + companies.
 */

// ── Seller Tier Definitions ──
export const TIERS = {
  platinum: { label: 'Platine', icon: '◆', color: '#475569', bg: 'linear-gradient(135deg, #e2e8f0, #cbd5e1, #e2e8f0)', border: '#94a3b8', glow: '0 0 12px rgba(148,163,184,0.4)', rank: 4 },
  gold:     { label: 'Or',      icon: '◆', color: '#92400e', bg: 'linear-gradient(135deg, #fef3c7, #fcd34d, #fef3c7)', border: '#f59e0b', glow: '0 0 10px rgba(245,158,11,0.3)', rank: 3 },
  silver:   { label: 'Argent',  icon: '◇', color: '#64748b', bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0, #f1f5f9)', border: '#94a3b8', glow: 'none', rank: 2 },
  bronze:   { label: 'Bronze',  icon: '○', color: '#9a3412', bg: 'linear-gradient(135deg, #fed7aa, #fdba74, #fed7aa)', border: '#f97316', glow: 'none', rank: 1 },
};

const VENDORS = [
  { id: 'S01', name: 'QUALIWATT',          country: 'FR', flag: '🇫🇷', rating: 4.9, reviews: 247, tier: 'platinum', verified: true, escrow: true, delivery: 'suntrex', colisVerif: true,  responseMin: 8,   transactions: 1842, joined: '2023', speciality: 'Huawei Premium Partner' },
  { id: 'S02', name: 'SolarPro GmbH',      country: 'DE', flag: '🇩🇪', rating: 4.7, reviews: 183, tier: 'gold',     verified: true, escrow: true, delivery: 'suntrex', colisVerif: true,  responseMin: 22,  transactions: 967,  joined: '2024', speciality: 'Multi-marques' },
  { id: 'S03', name: 'EnergieDirect BV',   country: 'NL', flag: '🇳🇱', rating: 4.6, reviews: 89,  tier: 'gold',     verified: true, escrow: true, delivery: 'seller',  colisVerif: false, responseMin: 35,  transactions: 423,  joined: '2024', speciality: 'Benelux specialist' },
  { id: 'S04', name: 'PV Supply Belgium',   country: 'BE', flag: '🇧🇪', rating: 4.5, reviews: 45,  tier: 'silver',   verified: true, escrow: true, delivery: 'suntrex', colisVerif: false, responseMin: 45,  transactions: 198,  joined: '2024', speciality: 'Benelux' },
  { id: 'S05', name: 'MedSolar SL',        country: 'ES', flag: '🇪🇸', rating: 4.4, reviews: 56,  tier: 'silver',   verified: true, escrow: true, delivery: 'seller',  colisVerif: false, responseMin: 60,  transactions: 145,  joined: '2025', speciality: 'Prix compétitifs' },
  { id: 'S06', name: 'VoltaItalia SRL',    country: 'IT', flag: '🇮🇹', rating: 4.3, reviews: 34,  tier: 'silver',   verified: true, escrow: false, delivery: 'seller', colisVerif: false, responseMin: 90,  transactions: 87,   joined: '2025', speciality: 'Sud Europe' },
  { id: 'S07', name: 'Nordic Solar ApS',   country: 'DK', flag: '🇩🇰', rating: 4.8, reviews: 56,  tier: 'gold',     verified: true, escrow: true, delivery: 'suntrex', colisVerif: true,  responseMin: 15,  transactions: 534,  joined: '2023', speciality: 'Scandinavie' },
  { id: 'S08', name: 'AlsaSolar SARL',     country: 'FR', flag: '🇫🇷', rating: 4.6, reviews: 31,  tier: 'silver',   verified: true, escrow: true, delivery: 'suntrex', colisVerif: false, responseMin: 30,  transactions: 203,  joined: '2024', speciality: 'Grand Est' },
  { id: 'S09', name: 'GreenTech Polska',   country: 'PL', flag: '🇵🇱', rating: 4.1, reviews: 19,  tier: 'bronze',   verified: false, escrow: false, delivery: 'seller', colisVerif: false, responseMin: 180, transactions: 31,  joined: '2025', speciality: 'Europe de l\'Est' },
  { id: 'S10', name: 'SunPower Austria',   country: 'AT', flag: '🇦🇹', rating: 4.5, reviews: 42,  tier: 'silver',   verified: true, escrow: true, delivery: 'seller',  colisVerif: false, responseMin: 50,  transactions: 112,  joined: '2024', speciality: 'DACH region' },
];

// Deterministic pseudo-random from product ID
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return function () {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 2147483647;
  };
}

/**
 * Generate multi-vendor offers for a product (v2 with tiers + badges)
 */
export function generateOffers(product) {
  if (!product || !product.id) return [];

  const rand = seededRandom(product.id + (product.sku || ''));
  const basePrice = product.price || 100;

  // 3-6 vendors per product
  const numVendors = Math.max(3, Math.min(6, Math.floor(rand() * 4) + 3));

  // Pick random vendors (always include QUALIWATT first)
  const shuffled = [...VENDORS].sort(() => rand() - 0.5);
  const selected = [VENDORS[0], ...shuffled.filter(v => v.id !== 'S01').slice(0, numVendors - 1)];

  const offers = selected.map((vendor, idx) => {
    const priceVariation = idx === 0 ? 1 : 0.92 + rand() * 0.23;
    const price = Math.round(basePrice * priceVariation * 100) / 100;

    const baseStock = product.stock || 50;
    const stockMin = Math.max(1, Math.floor(baseStock * (0.3 + rand() * 0.4)));
    const stockMax = Math.max(stockMin, Math.floor(baseStock * (0.8 + rand() * 0.5)));

    const deliveryDays = vendor.delivery === 'suntrex'
      ? Math.floor(rand() * 3) + 2
      : Math.floor(rand() * 5) + 4;

    const deliveryCost = vendor.delivery === 'suntrex'
      ? Math.round((15 + rand() * 35) * 100) / 100
      : Math.round((25 + rand() * 60) * 100) / 100;

    const moq = basePrice > 500 ? 1 : basePrice > 50 ? Math.floor(rand() * 5) + 1 : Math.floor(rand() * 10) + 5;

    return {
      sellerId: vendor.id,
      sellerName: vendor.name,
      country: vendor.country,
      flag: vendor.flag,
      rating: vendor.rating,
      reviews: vendor.reviews,
      // v2 fields
      tier: vendor.tier,
      verified: vendor.verified,
      escrow: vendor.escrow,
      colisVerif: vendor.colisVerif,
      delivery: vendor.delivery,
      responseMin: vendor.responseMin,
      transactions: vendor.transactions,
      joined: vendor.joined,
      speciality: vendor.speciality,
      // legacy compat
      badge: vendor.tier === 'platinum' ? 'trusted' : vendor.tier === 'gold' ? 'trusted' : vendor.verified ? 'verified' : 'new',
      bankTransfer: true,
      responseTime: vendor.responseMin < 60 ? `< ${vendor.responseMin}min` : `< ${Math.ceil(vendor.responseMin / 60)}h`,
      // pricing & stock
      price,
      priceWithDelivery: Math.round((price + deliveryCost / Math.max(moq, 1)) * 100) / 100,
      stockMin,
      stockMax,
      stock: stockMax,
      deliveryDays,
      deliveryCost,
      moq,
      isBestPrice: false,
      isBestDelivery: false,
    };
  });

  // Sort by price
  offers.sort((a, b) => a.price - b.price);

  // Mark best price and best delivery
  if (offers.length > 0) {
    offers[0].isBestPrice = true;
    const fastest = [...offers].sort((a, b) => a.deliveryDays - b.deliveryDays)[0];
    fastest.isBestDelivery = true;
  }

  return offers;
}

/**
 * Get similar products (same category, different product)
 */
export function getSimilarProducts(product, allProducts, limit = 4) {
  if (!product || !allProducts) return [];
  return allProducts
    .filter(p => p.category === product.category && p.id !== product.id && p.brand === product.brand)
    .slice(0, limit)
    .concat(
      allProducts
        .filter(p => p.category === product.category && p.id !== product.id && p.brand !== product.brand)
        .slice(0, limit)
    )
    .slice(0, limit);
}

/**
 * Comparison table row definitions
 */
export const COMPARISON_ROWS = [
  { label: 'Prix unitaire HT', key: 'price', fmt: v => '€' + v.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) },
  { label: 'Stock', key: 'stock', fmt: v => v > 0 ? v.toLocaleString() + ' pcs' : 'Sur commande' },
  { label: 'Délai', key: 'deliveryDays', fmt: v => v + ' jours' },
  { label: 'MOQ', key: 'moq', fmt: v => v + ' pcs' },
  { label: 'Note', key: 'rating', fmt: v => '★ ' + v.toFixed(1) },
  { label: 'Livraison', key: 'delivery', fmt: v => v === 'suntrex' ? '🚛 SUNTREX' : '📦 Vendeur' },
  { label: 'Escrow', key: 'escrow', fmt: v => v ? '✓ Oui' : '✗ Non' },
  { label: 'Vérif. colis', key: 'colisVerif', fmt: v => v ? '✓ Oui' : '✗ Non' },
  { label: 'Réponse', key: 'responseMin', fmt: v => v < 60 ? '~' + v + ' min' : '~' + Math.round(v / 60) + 'h' },
  { label: 'Transactions', key: 'transactions', fmt: v => v.toLocaleString() },
];
