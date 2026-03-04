// ═══ useProductOffers — Fetch multi-vendor offers for a product ═══
// Queries Supabase listings + profiles + companies
// Falls back to enriched mock data when Supabase is empty

import { useState, useEffect, useMemo } from "react";
// import { supabase } from "../lib/supabaseClient"; // Uncomment when ready

const FLAGS = { FR:"🇫🇷", DE:"🇩🇪", NL:"🇳🇱", BE:"🇧🇪", ES:"🇪🇸", IT:"🇮🇹", PT:"🇵🇹", AT:"🇦🇹", PL:"🇵🇱", CZ:"🇨🇿" };

const MOCK_SELLERS = [
  { id:"S01", name:"QUALIWATT", country:"FR", rating:4.9, reviews:247, tier:"platinum", verified:true, escrow:true, delivery:"suntrex", colisVerif:true, responseMin:8, transactions:1842, joined:"2023", speciality:"Huawei Premium Partner" },
  { id:"S02", name:"SolarPro GmbH", country:"DE", rating:4.7, reviews:183, tier:"gold", verified:true, escrow:true, delivery:"suntrex", colisVerif:true, responseMin:22, transactions:967, joined:"2024", speciality:"Multi-marques" },
  { id:"S03", name:"EnergieDirect BV", country:"NL", rating:4.6, reviews:89, tier:"gold", verified:true, escrow:true, delivery:"seller", colisVerif:false, responseMin:35, transactions:423, joined:"2024", speciality:"Benelux specialist" },
  { id:"S04", name:"MedSolar SL", country:"ES", rating:4.4, reviews:56, tier:"silver", verified:true, escrow:true, delivery:"seller", colisVerif:false, responseMin:60, transactions:198, joined:"2025", speciality:"Prix compétitifs" },
  { id:"S05", name:"VoltaItalia SRL", country:"IT", rating:4.3, reviews:34, tier:"silver", verified:true, escrow:false, delivery:"seller", colisVerif:false, responseMin:90, transactions:87, joined:"2025", speciality:"Sud Europe" },
  { id:"S06", name:"GreenTech Polska", country:"PL", rating:4.1, reviews:19, tier:"bronze", verified:false, escrow:false, delivery:"seller", colisVerif:false, responseMin:180, transactions:31, joined:"2025", speciality:"Europe de l'Est" },
];

function generateMockOffers(product) {
  const basePrice = product.p || product.price || 500;
  return MOCK_SELLERS.map((s, i) => {
    const variance = 1 + (i * 0.035) + (Math.sin(i * 2.7 + basePrice * 0.01) * 0.02);
    const price = Math.round(basePrice * variance * 100) / 100;
    const stockBase = product.q || product.stock || 50;
    const stock = Math.max(0, Math.round(stockBase * (1 - i * 0.15) + (Math.sin(i * 3.1) * stockBase * 0.1)));
    return { ...s, flag: FLAGS[s.country] || "🇪🇺", price, stock, leadDays: [2,3,4,5,7,10][i], moq: basePrice > 500 ? 1 : [1,1,2,3,5,10][i] };
  });
}

export function useProductOffers(product, { sort = "price-asc", filterCountry = "all", filterDelivery = "all" } = {}) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("mock"); // "supabase" | "mock"

  useEffect(() => {
    if (!product) return;
    
    async function fetchOffers() {
      setLoading(true);
      try {
        // TODO: Uncomment when Supabase listings are populated
        // const { data, error } = await supabase
        //   .from("listings")
        //   .select(`*, profiles(*), companies(*)`)
        //   .eq("sku", product.s || product.sku)
        //   .eq("status", "active");
        // if (data?.length > 0) { setOffers(data); setSource("supabase"); }
        // else { setOffers(generateMockOffers(product)); setSource("mock"); }
        
        setOffers(generateMockOffers(product));
        setSource("mock");
      } catch (err) {
        console.error("useProductOffers error:", err);
        setOffers(generateMockOffers(product));
        setSource("mock");
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [product?.id || product?.s]);

  const sorted = useMemo(() => {
    let s = [...offers];
    if (filterCountry !== "all") s = s.filter(o => o.country === filterCountry);
    if (filterDelivery !== "all") s = s.filter(o => o.delivery === filterDelivery);
    switch (sort) {
      case "price-asc": s.sort((a,b) => a.price - b.price); break;
      case "price-desc": s.sort((a,b) => b.price - a.price); break;
      case "stock": s.sort((a,b) => b.stock - a.stock); break;
      case "rating": s.sort((a,b) => b.rating - a.rating); break;
      case "lead": s.sort((a,b) => a.leadDays - b.leadDays); break;
    }
    return s;
  }, [offers, sort, filterCountry, filterDelivery]);

  const stats = useMemo(() => ({
    totalStock: offers.reduce((s,o) => s + o.stock, 0),
    bestPrice: offers.length > 0 ? Math.min(...offers.map(o => o.price)) : 0,
    sellerCount: offers.length,
    countries: [...new Set(offers.map(o => o.country))],
  }), [offers]);

  return { offers: sorted, allOffers: offers, loading, source, stats };
}

export default useProductOffers;
