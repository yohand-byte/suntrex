/**
 * SUNTREX — Multi-Vendor Offer Generator
 *
 * Generates realistic multi-vendor offers for product comparison.
 * In production, this will be replaced by real Supabase listings data.
 * For now, deterministic seeded generation based on product ID.
 */

const VENDORS = [
  { id: "S01", name: "QUALIWATT", country: "FR", flag: "\ud83c\uddeb\ud83c\uddf7", rating: 4.8, reviews: 142, badge: "trusted", bankTransfer: true, delivery: "suntrex", responseTime: "< 2h" },
  { id: "S02", name: "EnergyDist GmbH", country: "DE", flag: "\ud83c\udde9\ud83c\uddea", rating: 4.7, reviews: 98, badge: "trusted", bankTransfer: true, delivery: "suntrex", responseTime: "< 4h" },
  { id: "S03", name: "SolarWholesale NL", country: "NL", flag: "\ud83c\uddf3\ud83c\uddf1", rating: 4.6, reviews: 67, badge: "verified", bankTransfer: true, delivery: "standard", responseTime: "< 8h" },
  { id: "S04", name: "PV Supply Belgium", country: "BE", flag: "\ud83c\udde7\ud83c\uddea", rating: 4.5, reviews: 45, badge: "verified", bankTransfer: false, delivery: "suntrex", responseTime: "< 6h" },
  { id: "S05", name: "InstallSol SL", country: "ES", flag: "\ud83c\uddea\ud83c\uddf8", rating: 4.4, reviews: 34, badge: "new", bankTransfer: true, delivery: "standard", responseTime: "< 12h" },
  { id: "S06", name: "MountingPro SRL", country: "IT", flag: "\ud83c\uddee\ud83c\uddf9", rating: 4.3, reviews: 28, badge: "verified", bankTransfer: false, delivery: "standard", responseTime: "< 24h" },
  { id: "S07", name: "Nordic Solar ApS", country: "DK", flag: "\ud83c\udde9\ud83c\uddf0", rating: 4.9, reviews: 56, badge: "trusted", bankTransfer: true, delivery: "suntrex", responseTime: "< 3h" },
  { id: "S08", name: "AlsaSolar SARL", country: "FR", flag: "\ud83c\uddeb\ud83c\uddf7", rating: 4.6, reviews: 31, badge: "verified", bankTransfer: true, delivery: "suntrex", responseTime: "< 4h" },
];

// Deterministic pseudo-random from product ID
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return function() {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 2147483647;
  };
}

/**
 * Generate multi-vendor offers for a product
 * @param {object} product - Product from REAL_PRODUCTS
 * @returns {array} Array of 2-5 vendor offers, sorted by price
 */
export function generateOffers(product) {
  if (!product || !product.id) return [];
  
  const rand = seededRandom(product.id + product.sku);
  const basePrice = product.price || 100;
  
  // 2-5 vendors per product (more popular products = more vendors)
  const numVendors = Math.max(2, Math.min(5, Math.floor(rand() * 4) + 2));
  
  // Pick random vendors (always include QUALIWATT as first)
  const shuffled = [...VENDORS].sort(() => rand() - 0.5);
  const selectedVendors = [VENDORS[0], ...shuffled.filter(v => v.id !== "S01").slice(0, numVendors - 1)];
  
  const offers = selectedVendors.map((vendor, idx) => {
    // Price variation: -8% to +15% from base price
    const priceVariation = idx === 0 
      ? 1 // QUALIWATT = base price
      : 0.92 + rand() * 0.23;
    const price = Math.round(basePrice * priceVariation * 100) / 100;
    
    // Stock variation
    const baseStock = product.stock || 50;
    const stockMin = Math.max(1, Math.floor(baseStock * (0.3 + rand() * 0.4)));
    const stockMax = Math.max(stockMin, Math.floor(baseStock * (0.8 + rand() * 0.5)));
    
    // Delivery time
    const deliveryDays = vendor.delivery === "suntrex" 
      ? Math.floor(rand() * 3) + 2 
      : Math.floor(rand() * 5) + 4;
    
    // Delivery cost estimate
    const deliveryCost = vendor.delivery === "suntrex"
      ? Math.round((15 + rand() * 35) * 100) / 100
      : Math.round((25 + rand() * 60) * 100) / 100;
    
    // MOQ (minimum order quantity)
    const moq = basePrice > 500 ? 1 : (basePrice > 50 ? Math.floor(rand() * 5) + 1 : Math.floor(rand() * 10) + 5);
    
    return {
      sellerId: vendor.id,
      sellerName: vendor.name,
      country: vendor.country,
      flag: vendor.flag,
      rating: vendor.rating,
      reviews: vendor.reviews,
      badge: vendor.badge,
      bankTransfer: vendor.bankTransfer,
      delivery: vendor.delivery,
      responseTime: vendor.responseTime,
      price,
      priceWithDelivery: Math.round((price + deliveryCost / Math.max(moq, 1)) * 100) / 100,
      stockMin,
      stockMax,
      stock: stockMax,
      deliveryDays,
      deliveryCost,
      moq,
      availableDate: deliveryDays <= 3 ? null : new Date(Date.now() + deliveryDays * 86400000).toISOString().split("T")[0],
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
 * @param {object} product - Current product
 * @param {array} allProducts - All products catalog
 * @param {number} limit - Max similar products
 * @returns {array}
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
