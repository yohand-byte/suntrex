import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import ProductCard from "../components/catalog/ProductCard";
import ProductModal from "../components/catalog/ProductModal";
import { FilterSection, CheckFilter } from "../components/catalog/FilterSidebar";
import RangeFilter from "../components/catalog/RangeFilter";
import useResponsive from "../hooks/useResponsive";
import useSmartSearch from "../hooks/useSmartSearch";
import useProductsCatalog from "../hooks/useProductsCatalog";

var SmartComparator = lazy(function () { return import("../components/ai/SmartComparator"); });

const ITEMS_PER_PAGE = 24;

const TAG_COLORS = {
  brand: { bg: "#e3f2fd", color: "#1565c0" },
  type: { bg: "#fce4ec", color: "#c62828" },
  phase: { bg: "#f3e5f5", color: "#6a1b9a" },
  mppt: { bg: "#fff3e0", color: "#e65100" },
  power: { bg: "#e0f2f1", color: "#00695c" },
  price: { bg: "#fffde7", color: "#f57f17" },
  stock: { bg: "#e8f5e9", color: "#2e7d32" },
};

const S = {
  page: {
    display: "flex",
    maxWidth: 1280,
    margin: "0 auto",
    gap: 24,
    fontFamily: "'DM Sans',sans-serif",
  },
  sidebar: { flexShrink: 0 },
  main: { flex: 1, minWidth: 0 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity .15s",
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#555",
    fontFamily: "inherit",
  },
  pageBtnActive: {
    border: "1px solid #E8700A",
    background: "#E8700A",
    color: "#fff",
  },
};

export default function CatalogPage({ isLoggedIn, onLogin }) {
  const { t } = useTranslation(["catalog", "common"]);
  const tcatalog = (key, opts) => t(`catalog:${key}`, opts);
  const tcommon = (key, opts) => t(`common:${key}`, opts);
  const { formatMoney, currencyInfo } = useCurrency();
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();
  const topRef = useRef(null);
  const { isMobile } = useResponsive();
  const { products, loading: productsLoading } = useProductsCatalog();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const PHASE_LABELS = { "1": tcatalog("monophase"), "3": tcatalog("triphase") };
  const catalogItems = useMemo(() => products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    power: p.powerKw || (p.capacityKwh ? p.capacityKwh : 0),
    type: p.type,
    phases: p.phases || 0,
    mppt: p.mppt || 0,
    image: p.image,
    sku: p.sku,
    efficiency: p.efficiency || null,
    protection: p.protection || null,
    weight: p.weight || null,
    warranty: p.warranty || null,
    dimensions: p.dimensions || null,
    capacityKwh: p.capacityKwh || null,
    certifications: p.certifications || [],
    features: p.features || [],
    datasheet: p.datasheet || null,
    description: p.description || null,
    offers: [
      {
        sellerId: "S01",
        sellerName: p.seller || "QUALIWATT",
        country: "FR",
        flag: "\u{1F1EB}\u{1F1F7}",
        rating: 4.8,
        reviews: 8,
        stock: p.stock,
        price: p.price,
        badge: "trusted",
        bankTransfer: true,
        delivery: "suntrex",
      },
    ],
  })), [products]);

  /* ── Derive filter options from data ── */
  const filterOptions = useMemo(() => {
    const brands = [...new Set(catalogItems.map((p) => p.brand))].sort();
    const types = [...new Set(catalogItems.map((p) => p.type))].sort();
    const phases = [
      ...new Set(
        catalogItems.filter((p) => p.phases > 0).map((p) => String(p.phases))
      ),
    ].sort();
    const mppts = [
      ...new Set(
        catalogItems.filter((p) => p.mppt > 0).map((p) => String(p.mppt))
      ),
    ].sort((a, b) => Number(a) - Number(b));
    const powers = catalogItems.map((p) => p.power).filter((p) => p > 0);
    const prices = catalogItems.flatMap((p) => p.offers.map((o) => o.price));
    return {
      brands,
      types,
      phases,
      mppts,
      powerMin: powers.length ? Math.floor(Math.min(...powers)) : 0,
      powerMax: powers.length ? Math.ceil(Math.max(...powers)) : 0,
      priceMin: prices.length ? Math.floor(Math.min(...prices)) : 0,
      priceMax: prices.length ? Math.ceil(Math.max(...prices)) : 0,
    };
  }, [catalogItems]);

  const CATEGORIES = useMemo(
    () => [
      { id: "all", label: tcatalog("allProducts"), count: catalogItems.length },
      {
        id: "panels",
        label: tcatalog("solarPanels", "Panneaux solaires"),
        count: catalogItems.filter((p) => p.category === "panels").length,
      },
      {
        id: "inverters",
        label: tcatalog("inverters"),
        count: catalogItems.filter((p) => p.category === "inverters").length,
      },
      {
        id: "batteries",
        label: tcatalog("batteriesStorage"),
        count: catalogItems.filter((p) => p.category === "batteries").length,
      },
      {
        id: "electrical",
        label: tcatalog("electrical", "Électrotechnique"),
        count: catalogItems.filter((p) => p.category === "electrical").length,
      },
      {
        id: "mounting",
        label: tcatalog("mounting", "Systèmes de montage"),
        count: catalogItems.filter((p) => p.category === "mounting").length,
      },
      {
        id: "optimizers",
        label: tcatalog("optimizers"),
        count: catalogItems.filter((p) => p.category === "optimizers").length,
      },
      {
        id: "ev-chargers",
        label: tcatalog("chargingStations"),
        count: catalogItems.filter((p) => p.category === "ev-chargers").length,
      },
      {
        id: "accessories",
        label: tcatalog("accessories"),
        count: catalogItems.filter((p) => p.category === "accessories").length,
      },
    ],
    [catalogItems, t]
  );

  /* ── States ── */
  const [searchParams] = useSearchParams();
  const queryCategory = searchParams.get("category");
  const queryBrand = searchParams.get("brand");
  const querySearch = searchParams.get("q") || "";

  const [activeCategory, setActiveCategory] = useState(urlCategory || queryCategory || "all");
  useEffect(() => {
    setActiveCategory(urlCategory || queryCategory || "all");
  }, [urlCategory, queryCategory]);

  const [selectedBrands, setSelectedBrands] = useState(queryBrand ? [queryBrand] : []);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [selectedMppts, setSelectedMppts] = useState([]);
  const [powerMin, setPowerMin] = useState(null);
  const [powerMax, setPowerMax] = useState(null);
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState(querySearch);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const smartSearch = useSmartSearch(products, { maxResults: 6 });
  const [quickFilters, setQuickFilters] = useState({
    bankTransfer: false,
    suntrexDelivery: false,
    trusted: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [showComparator, setShowComparator] = useState(false);

  useEffect(() => {
    setSelectedBrands(queryBrand ? [queryBrand] : []);
  }, [queryBrand]);

  useEffect(() => {
    setSearchQuery(querySearch);
  }, [querySearch]);

  const toggleCompare = useCallback(function (productId) {
    setCompareIds(function (prev) {
      if (prev.includes(productId)) return prev.filter(function (id) { return id !== productId; });
      if (prev.length >= 4) return prev;
      return prev.concat(productId);
    });
  }, []);

  const compareProducts = useMemo(function () {
    return compareIds.map(function (id) { return catalogItems.find(function (p) { return p.id === id; }); }).filter(Boolean).map(function (p) {
      var src = products.find(function (rp) { return rp.id === p.id; });
      return Object.assign({}, p, src || {});
    });
  }, [catalogItems, compareIds, products]);

  /* ── Toggle helpers ── */
  const toggle = (setter) => (val) =>
    setter((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  const toggleBrand = toggle(setSelectedBrands);
  const toggleType = toggle(setSelectedTypes);
  const togglePhase = toggle(setSelectedPhases);
  const toggleMppt = toggle(setSelectedMppts);
  const toggleQuick = (key) =>
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Reset page on any filter change ── */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory,
    selectedBrands,
    selectedTypes,
    selectedPhases,
    selectedMppts,
    powerMin,
    powerMax,
    priceMin,
    priceMax,
    inStockOnly,
    searchQuery,
    quickFilters,
    sortBy,
  ]);

  /* ── Filtering pipeline ── */
  const filtered = useMemo(() => {
    let items = [...catalogItems];

    // 1. Category
    if (activeCategory !== "all")
      items = items.filter((p) => p.category === activeCategory);

    // 2. Brand
    if (selectedBrands.length)
      items = items.filter((p) => selectedBrands.includes(p.brand));

    // 3. Type
    if (selectedTypes.length)
      items = items.filter((p) => selectedTypes.includes(p.type));

    // 4. Phases
    if (selectedPhases.length)
      items = items.filter((p) =>
        selectedPhases.includes(String(p.phases))
      );

    // 5. MPPT
    if (selectedMppts.length)
      items = items.filter((p) => selectedMppts.includes(String(p.mppt)));

    // 6. Search (smart: fuzzy + synonyms + multi-field)
    if (searchQuery.trim()) {
      smartSearch.setQuery(searchQuery);
      const matchIds = new Set(smartSearch.results.map(r => r.id));
      if (matchIds.size > 0) {
        items = items.filter(p => matchIds.has(p.id));
      } else {
        // Fallback to simple includes for very short queries
        const q = searchQuery.toLowerCase();
        items = items.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
        );
      }
    }

    // 7. Stock
    if (inStockOnly)
      items = items.filter((p) => p.offers.some((o) => o.stock > 0));

    // 8. Quick filters
    if (quickFilters.bankTransfer)
      items = items.filter((p) => p.offers.some((o) => o.bankTransfer));
    if (quickFilters.suntrexDelivery)
      items = items.filter((p) =>
        p.offers.some((o) => o.delivery === "suntrex")
      );
    if (quickFilters.trusted)
      items = items.filter((p) =>
        p.offers.some((o) => o.badge === "trusted")
      );

    // 9. Power range
    if (powerMin != null) items = items.filter((p) => p.power >= powerMin);
    if (powerMax != null) items = items.filter((p) => p.power <= powerMax);

    // 10. Price range
    if (priceMin != null)
      items = items.filter((p) =>
        p.offers.some((o) => o.price >= priceMin)
      );
    if (priceMax != null)
      items = items.filter((p) =>
        p.offers.some((o) => o.price <= priceMax)
      );

    // 11. Sort
    if (sortBy === "price-asc")
      items.sort(
        (a, b) =>
          Math.min(...a.offers.map((o) => o.price)) -
          Math.min(...b.offers.map((o) => o.price))
      );
    if (sortBy === "price-desc")
      items.sort(
        (a, b) =>
          Math.min(...b.offers.map((o) => o.price)) -
          Math.min(...a.offers.map((o) => o.price))
      );
    if (sortBy === "stock")
      items.sort(
        (a, b) =>
          b.offers.reduce((s, o) => s + o.stock, 0) -
          a.offers.reduce((s, o) => s + o.stock, 0)
      );

    return items;
  }, [
    activeCategory,
    catalogItems,
    selectedBrands,
    selectedTypes,
    selectedPhases,
    selectedMppts,
    searchQuery,
    inStockOnly,
    quickFilters,
    powerMin,
    powerMax,
    priceMin,
    priceMax,
    sortBy,
  ]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filtered, currentPage]
  );

  const goToPage = useCallback(
    (page) => {
      const p = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(p);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [totalPages]
  );

  if (productsLoading) {
    return <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Chargement du catalogue...</div>
      <div style={{ fontSize: 14, color: "#6b7280" }}>Les produits SUNTREX sont en cours de chargement.</div>
    </div>;
  }

  /* ── Clear all filters ── */
  const clearAll = () => {
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedPhases([]);
    setSelectedMppts([]);
    setPowerMin(null);
    setPowerMax(null);
    setPriceMin(null);
    setPriceMax(null);
    setInStockOnly(false);
    setSearchQuery("");
    setQuickFilters({
      bankTransfer: false,
      suntrexDelivery: false,
      trusted: false,
    });
  };

  /* ── Active filter tags ── */
  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedTypes.length > 0 ||
    selectedPhases.length > 0 ||
    selectedMppts.length > 0 ||
    powerMin != null ||
    powerMax != null ||
    priceMin != null ||
    priceMax != null ||
    inStockOnly;

  const renderTag = (label, colorKey, onRemove) => (
    <span
      key={label}
      onClick={onRemove}
      style={{
        ...S.badge,
        background: TAG_COLORS[colorKey].bg,
        color: TAG_COLORS[colorKey].color,
      }}
    >
      {label} ✕
    </span>
  );

  /* ── Page buttons (smart pagination with ellipses) ── */
  const renderPageButtons = () => {
    const delta = 2;
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    const rangeWithDots = [];
    let prev = 0;
    for (const i of range) {
      if (prev && i - prev > 1) rangeWithDots.push("...");
      rangeWithDots.push(i);
      prev = i;
    }
    return rangeWithDots.map((item, idx) => {
      if (item === "...") {
        return (
          <span key={`dots-${idx}`} style={{ padding: "4px 6px", color: "#999", fontSize: 13, userSelect: "none" }}>
            …
          </span>
        );
      }
      return (
        <button
          key={item}
          onClick={() => goToPage(item)}
          style={{ ...S.pageBtn, ...(currentPage === item ? S.pageBtnActive : {}) }}
        >
          {item}
        </button>
      );
    });
  };

  return (
    <div style={{...S.page, flexDirection: isMobile ? "column" : "row", padding: isMobile ? "16px 16px" : "24px 20px"}} ref={topRef}>
      {/* Mobile filter toggle */}
      {isMobile && (
        <button onClick={() => setShowMobileFilters(!showMobileFilters)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:8,border:"1px solid #ddd",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:12,color:"#555"}}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
          {tcatalog("filters")} {hasActiveFilters && <span style={{background:"#E8700A",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11}}>{selectedBrands.length+selectedTypes.length+selectedPhases.length+selectedMppts.length+(inStockOnly?1:0)+(powerMin!=null||powerMax!=null?1:0)+(priceMin!=null||priceMax!=null?1:0)}</span>}
        </button>
      )}
      {/* ══════ SIDEBAR ══════ */}
      <aside style={{...S.sidebar, display: isMobile ? (showMobileFilters ? "block" : "none") : "block", width: isMobile ? "100%" : 240}}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 16,
            color: "#222",
          }}
        >
          {tcatalog("filters")}
        </h2>

        {/* Search with smart suggestions */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <input
            type="text"
            placeholder={tcatalog("searchProduct")}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); smartSearch.setQuery(e.target.value); setShowSearchSuggestions(e.target.value.length >= 2); }}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearchSuggestions(true); }}
            onBlur={() => { setTimeout(function() { setShowSearchSuggestions(false); }, 200); }}
            aria-label={tcatalog("searchProduct")}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ddd",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {showSearchSuggestions && smartSearch.suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", borderRadius: "0 0 8px 8px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50, overflow: "hidden", border: "1px solid #e2e8f0", borderTop: "none" }}>
              {smartSearch.suggestions.map(function (p) {
                return (
                  <div
                    key={p.id}
                    onMouseDown={function () { navigate("/product/" + p.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f8fafc", transition: "background .1s" }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = "#fff"; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 4, background: "#f8fafc", border: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {p.image ? <img src={p.image} alt={p.name} loading="lazy" width="28" height="28" style={{ maxWidth: 28, maxHeight: 28, objectFit: "contain" }} /> : <span style={{ fontSize: 8, color: "#bbb" }}>{p.brand}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.brand} · {p.sku}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 1. Disponibilité toggle */}
        <FilterSection title={tcatalog("availability")}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "#444",
              cursor: "pointer",
            }}
          >
            {tcatalog("inStockOnly")}
            <div
              onClick={(e) => {
                e.preventDefault();
                setInStockOnly(!inStockOnly);
              }}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: inStockOnly ? "#4CAF50" : "#ddd",
                cursor: "pointer",
                position: "relative",
                transition: "background .2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 2,
                  left: inStockOnly ? 20 : 2,
                  transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }}
              />
            </div>
          </label>
        </FilterSection>

        {/* 2. Puissance */}
        <FilterSection title={tcatalog("powerKw")} defaultOpen={false}>
          <RangeFilter
            min={filterOptions.powerMin}
            max={filterOptions.powerMax}
            valueMin={powerMin}
            valueMax={powerMax}
            onChangeMin={setPowerMin}
            onChangeMax={setPowerMax}
            step={0.5}
            unit="kW"
          />
        </FilterSection>

        {/* 3. Marque */}
        <FilterSection title={tcatalog("brand")}>
          <CheckFilter
            items={filterOptions.brands}
            selected={selectedBrands}
            onToggle={toggleBrand}
          />
        </FilterSection>

        {/* 4. Prix */}
        <FilterSection title={tcatalog("priceEur")} defaultOpen={false}>
          <RangeFilter
            min={filterOptions.priceMin}
            max={filterOptions.priceMax}
            valueMin={priceMin}
            valueMax={priceMax}
            onChangeMin={setPriceMin}
            onChangeMax={setPriceMax}
            step={10}
            unit={currencyInfo.symbol}
          />
        </FilterSection>

        {/* 5. Type */}
        <FilterSection title={tcatalog("type")}>
          <CheckFilter
            items={filterOptions.types}
            selected={selectedTypes}
            onToggle={toggleType}
          />
        </FilterSection>

        {/* 6. Phases */}
        <FilterSection title={tcatalog("phases")} defaultOpen={false}>
          <CheckFilter
            items={filterOptions.phases}
            selected={selectedPhases}
            onToggle={togglePhase}
          />
        </FilterSection>

        {/* 7. MPPT */}
        <FilterSection title={tcatalog("mppt")} defaultOpen={false}>
          <CheckFilter
            items={filterOptions.mppts}
            selected={selectedMppts}
            onToggle={toggleMppt}
          />
        </FilterSection>

        {/* 8. Catégories */}
        <FilterSection title={tcatalog("categoriesTitle")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "none",
                  background:
                    activeCategory === cat.id ? "#fff3e0" : "transparent",
                  color: activeCategory === cat.id ? "#E8700A" : "#555",
                  fontWeight: activeCategory === cat.id ? 600 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <span>{cat.label}</span>
                <span style={{ color: "#bbb", fontSize: 12 }}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      </aside>

      {/* ══════ MAIN ══════ */}
      <main style={S.main}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}
            >
              {CATEGORIES.find((c) => c.id === activeCategory)?.label ||
                tcatalog("catalogTitle")}
            </h1>
            <span style={{ fontSize: 13, color: "#888" }}>
              {filtered.length} {tcatalog("results")}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#555",
                cursor: "pointer",
              }}
            >
              {tcatalog("grouping")}
              <div
                onClick={() => setGrouped(!grouped)}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: grouped ? "#4CAF50" : "#ddd",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background .2s",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 2,
                    left: grouped ? 20 : 2,
                    transition: "left .2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  }}
                />
              </div>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 13,
                color: "#555",
                fontFamily: "inherit",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="relevance">{tcatalog("sortRelevance")}</option>
              <option value="price-asc">{tcatalog("sortPriceAsc")}</option>
              <option value="price-desc">{tcatalog("sortPriceDesc")}</option>
              <option value="stock">{tcatalog("sortStock")}</option>
            </select>
          </div>
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {selectedBrands.map((b) =>
              renderTag(b, "brand", () => toggleBrand(b))
            )}
            {selectedTypes.map((tp) =>
              renderTag(tp, "type", () => toggleType(tp))
            )}
            {selectedPhases.map((p) =>
              renderTag(PHASE_LABELS[p] || `Phase ${p}`, "phase", () =>
                togglePhase(p)
              )
            )}
            {selectedMppts.map((m) =>
              renderTag(`MPPT ${m}`, "mppt", () => toggleMppt(m))
            )}
            {(powerMin != null || powerMax != null) &&
              renderTag(
                `${tcatalog("powerLabel")} ${powerMin ?? filterOptions.powerMin}–${powerMax ?? filterOptions.powerMax} kW`,
                "power",
                () => {
                  setPowerMin(null);
                  setPowerMax(null);
                }
              )}
            {(priceMin != null || priceMax != null) &&
              renderTag(
                `${tcatalog("priceLabel")} ${priceMin ?? filterOptions.priceMin}–${priceMax ?? filterOptions.priceMax} ${currencyInfo.symbol}`,
                "price",
                () => {
                  setPriceMin(null);
                  setPriceMax(null);
                }
              )}
            {inStockOnly &&
              renderTag(tcatalog("inStock"), "stock", () => setInStockOnly(false))}
            <button
              onClick={clearAll}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: "#888",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              {tcatalog("clearAll")}
            </button>
          </div>
        )}

        {/* Product list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paginatedItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {tcatalog("noProductFound")}
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {tcatalog("tryModifyFilters")}
              </div>
            </div>
          ) : (
            paginatedItems.map((product) => (
              <div key={product.id} style={{ position: "relative" }}>
                <ProductCard
                  product={product}
                  isLoggedIn={isLoggedIn}
                  onLogin={onLogin}
                  grouped={grouped}
                  onOpenModal={setModalProduct}
                />
                <button
                  onClick={function (e) { e.stopPropagation(); toggleCompare(product.id); }}
                  aria-label={compareIds.includes(product.id) ? "Remove from comparison" : "Add to comparison"}
                  style={{
                    position: "absolute", top: 8, right: 8, zIndex: 5,
                    width: 28, height: 28, borderRadius: 6,
                    border: compareIds.includes(product.id) ? "2px solid #E8700A" : "1px solid #d1d5db",
                    background: compareIds.includes(product.id) ? "#fff7ed" : "#fff",
                    cursor: compareIds.length >= 4 && !compareIds.includes(product.id) ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: compareIds.includes(product.id) ? "#E8700A" : "#94a3b8",
                    opacity: compareIds.length >= 4 && !compareIds.includes(product.id) ? 0.4 : 1,
                  }}
                >
                  {compareIds.includes(product.id) ? "\u2713" : "\u2696"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 24,
              padding: 16,
            }}
          >
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...S.pageBtn,
                opacity: currentPage === 1 ? 0.4 : 1,
                cursor: currentPage === 1 ? "default" : "pointer",
              }}
            >
              ←
            </button>
            {renderPageButtons()}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...S.pageBtn,
                opacity: currentPage === totalPages ? 0.4 : 1,
                cursor: currentPage === totalPages ? "default" : "pointer",
              }}
            >
              →
            </button>
            <span style={{ fontSize: 13, color: "#888", marginLeft: 8 }}>
              {tcatalog("page")} {currentPage} {tcatalog("of")} {totalPages}
            </span>
          </div>
        )}
      </main>

      {/* ── Product Quick View Modal ── */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
          onClose={() => setModalProduct(null)}
        />
      )}

      {/* ── Smart Comparator Panel ── */}
      {showComparator && compareProducts.length >= 2 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "auto", position: "relative" }}>
            <button onClick={function () { setShowComparator(false); }} aria-label="Close comparator" style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, border: "none", background: "#f1f5f9", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
              &times;
            </button>
            <Suspense fallback={null}>
              <SmartComparator
                products={compareProducts}
                onRemove={function (id) { toggleCompare(id); }}
                lang={t("lang") === "lang" ? "fr" : t("lang")}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* ── Floating Compare Bar ── */}
      {compareIds.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900, background: "#1e293b", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, boxShadow: "0 -4px 20px rgba(0,0,0,0.2)" }}>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
            {compareIds.length}/4 {tcatalog("selected", "selectionnes")}
          </span>
          <button
            onClick={function () { setShowComparator(true); }}
            disabled={compareIds.length < 2}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: compareIds.length >= 2 ? "#E8700A" : "#475569", color: "#fff", fontSize: 13, fontWeight: 600, cursor: compareIds.length >= 2 ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          >
            {tcatalog("compare", "Comparer")}
          </button>
          <button
            onClick={function () { setCompareIds([]); }}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            {tcatalog("clearAll", "Effacer")}
          </button>
        </div>
      )}
    </div>
  );
}
