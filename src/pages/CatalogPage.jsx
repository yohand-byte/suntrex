import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import REAL_PRODUCTS from "../products";
import ProductCard from "../components/catalog/ProductCard";
import ProductModal from "../components/catalog/ProductModal";
import { FilterSection, CheckFilter } from "../components/catalog/FilterSidebar";
import RangeFilter from "../components/catalog/RangeFilter";
import useResponsive from "../hooks/useResponsive";

/* ── Build catalog from real products ── */
const CATALOG = REAL_PRODUCTS.map((p) => ({
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
  // Enriched fields for ProductCard + ProductModal
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
}));

const ITEMS_PER_PAGE = 12;

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
    padding: "24px 20px",
    gap: 24,
    fontFamily: "'DM Sans',sans-serif",
  },
  sidebar: { width: 260, flexShrink: 0 },
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
  const { t } = useTranslation();
  const { formatMoney, currencyInfo } = useCurrency();
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();
  const topRef = useRef(null);
  const { isMobile } = useResponsive();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const PHASE_LABELS = { "1": t("catalog.monophase"), "3": t("catalog.triphase") };

  /* ── Derive filter options from data ── */
  const filterOptions = useMemo(() => {
    const brands = [...new Set(CATALOG.map((p) => p.brand))].sort();
    const types = [...new Set(CATALOG.map((p) => p.type))].sort();
    const phases = [
      ...new Set(
        CATALOG.filter((p) => p.phases > 0).map((p) => String(p.phases))
      ),
    ].sort();
    const mppts = [
      ...new Set(
        CATALOG.filter((p) => p.mppt > 0).map((p) => String(p.mppt))
      ),
    ].sort((a, b) => Number(a) - Number(b));
    const powers = CATALOG.map((p) => p.power).filter((p) => p > 0);
    const prices = CATALOG.flatMap((p) => p.offers.map((o) => o.price));
    return {
      brands,
      types,
      phases,
      mppts,
      powerMin: Math.floor(Math.min(...powers)),
      powerMax: Math.ceil(Math.max(...powers)),
      priceMin: Math.floor(Math.min(...prices)),
      priceMax: Math.ceil(Math.max(...prices)),
    };
  }, []);

  const CATEGORIES = useMemo(
    () => [
      { id: "all", label: t("catalog.allProducts"), count: CATALOG.length },
      {
        id: "panels",
        label: t("catalog.solarPanels", "Panneaux solaires"),
        count: CATALOG.filter((p) => p.category === "panels").length,
      },
      {
        id: "inverters",
        label: t("catalog.inverters"),
        count: CATALOG.filter((p) => p.category === "inverters").length,
      },
      {
        id: "batteries",
        label: t("catalog.batteriesStorage"),
        count: CATALOG.filter((p) => p.category === "batteries").length,
      },
      {
        id: "cables",
        label: t("catalog.cables", "Câbles"),
        count: CATALOG.filter((p) => p.category === "cables").length,
      },
      {
        id: "mounting",
        label: t("catalog.mounting", "Systèmes de montage"),
        count: CATALOG.filter((p) => p.category === "mounting").length,
      },
      {
        id: "optimizers",
        label: t("catalog.optimizers"),
        count: CATALOG.filter((p) => p.category === "optimizers").length,
      },
      {
        id: "ev-chargers",
        label: t("catalog.chargingStations"),
        count: CATALOG.filter((p) => p.category === "ev-chargers").length,
      },
      {
        id: "accessories",
        label: t("catalog.accessories"),
        count: CATALOG.filter((p) => p.category === "accessories").length,
      },
    ],
    [t]
  );

  /* ── States ── */
  const [activeCategory, setActiveCategory] = useState(urlCategory || "all");
  useEffect(() => {
    setActiveCategory(urlCategory || "all");
  }, [urlCategory]);

  const [selectedBrands, setSelectedBrands] = useState([]);
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
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [quickFilters, setQuickFilters] = useState({
    bankTransfer: false,
    suntrexDelivery: false,
    trusted: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null);

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
    let items = [...CATALOG];

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

    // 6. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
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

  /* ── Page buttons ── */
  const renderPageButtons = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          style={{
            ...S.pageBtn,
            ...(currentPage === i ? S.pageBtnActive : {}),
          }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div style={{...S.page, flexDirection: isMobile ? "column" : "row", padding: isMobile ? "16px 16px" : "24px 20px"}} ref={topRef}>
      {/* Mobile filter toggle */}
      {isMobile && (
        <button onClick={() => setShowMobileFilters(!showMobileFilters)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:8,border:"1px solid #ddd",background:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:12,color:"#555"}}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
          {t("catalog.filters")} {hasActiveFilters && <span style={{background:"#E8700A",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11}}>{selectedBrands.length+selectedTypes.length+selectedPhases.length+selectedMppts.length+(inStockOnly?1:0)+(powerMin!=null||powerMax!=null?1:0)+(priceMin!=null||priceMax!=null?1:0)}</span>}
        </button>
      )}
      {/* ══════ SIDEBAR ══════ */}
      <aside style={{...S.sidebar, display: isMobile ? (showMobileFilters ? "block" : "none") : "block", width: isMobile ? "100%" : 260}}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 16,
            color: "#222",
          }}
        >
          {t("catalog.filters")}
        </h2>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder={t("catalog.searchProduct")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>

        {/* 1. Disponibilité toggle */}
        <FilterSection title={t("catalog.availability")}>
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
            {t("catalog.inStockOnly")}
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
        <FilterSection title={t("catalog.powerKw")} defaultOpen={false}>
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
        <FilterSection title={t("catalog.brand")}>
          <CheckFilter
            items={filterOptions.brands}
            selected={selectedBrands}
            onToggle={toggleBrand}
          />
        </FilterSection>

        {/* 4. Prix */}
        <FilterSection title={t("catalog.priceEur")} defaultOpen={false}>
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
        <FilterSection title={t("catalog.type")}>
          <CheckFilter
            items={filterOptions.types}
            selected={selectedTypes}
            onToggle={toggleType}
          />
        </FilterSection>

        {/* 6. Phases */}
        <FilterSection title={t("catalog.phases")} defaultOpen={false}>
          <CheckFilter
            items={filterOptions.phases}
            selected={selectedPhases}
            onToggle={togglePhase}
          />
        </FilterSection>

        {/* 7. MPPT */}
        <FilterSection title={t("catalog.mppt")} defaultOpen={false}>
          <CheckFilter
            items={filterOptions.mppts}
            selected={selectedMppts}
            onToggle={toggleMppt}
          />
        </FilterSection>

        {/* 8. Catégories */}
        <FilterSection title={t("catalog.categoriesTitle")}>
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
                t("catalog.catalogTitle")}
            </h1>
            <span style={{ fontSize: 13, color: "#888" }}>
              {filtered.length} {t("catalog.results")}
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
              {t("catalog.grouping")}
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
              <option value="relevance">{t("catalog.sortRelevance")}</option>
              <option value="price-asc">{t("catalog.sortPriceAsc")}</option>
              <option value="price-desc">{t("catalog.sortPriceDesc")}</option>
              <option value="stock">{t("catalog.sortStock")}</option>
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
                `${t("catalog.powerLabel")} ${powerMin ?? filterOptions.powerMin}–${powerMax ?? filterOptions.powerMax} kW`,
                "power",
                () => {
                  setPowerMin(null);
                  setPowerMax(null);
                }
              )}
            {(priceMin != null || priceMax != null) &&
              renderTag(
                `${t("catalog.priceLabel")} ${priceMin ?? filterOptions.priceMin}–${priceMax ?? filterOptions.priceMax} ${currencyInfo.symbol}`,
                "price",
                () => {
                  setPriceMin(null);
                  setPriceMax(null);
                }
              )}
            {inStockOnly &&
              renderTag(t("catalog.inStock"), "stock", () => setInStockOnly(false))}
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
              {t("catalog.clearAll")}
            </button>
          </div>
        )}

        {/* Product list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paginatedItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {t("catalog.noProductFound")}
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {t("catalog.tryModifyFilters")}
              </div>
            </div>
          ) : (
            paginatedItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isLoggedIn={isLoggedIn}
                onLogin={onLogin}
                grouped={grouped}
                onOpenModal={setModalProduct}
              />
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
              {t("catalog.page")} {currentPage} {t("catalog.of")} {totalPages}
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
    </div>
  );
}
