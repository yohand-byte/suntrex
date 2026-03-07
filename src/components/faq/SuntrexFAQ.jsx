import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useResponsive from "../../hooks/useResponsive";

/* ═══════════════════════════════════════════════════════════════════════
   SUNTREX — Centre d'aide / FAQ
   Professional B2B solar marketplace help center
   Categories: Orders, Delivery, Registration/KYC, Technical PV
   ═══════════════════════════════════════════════════════════════════════ */

const B = {
  orange: "#E8700A", orangeLight: "#FFF4E8", orangeDark: "#C45E08",
  dark: "#0F1923", text: "#1a2b3d", muted: "#64748b", light: "#f8fafc",
  white: "#fff", border: "#e2e8f0", green: "#10b981", greenLight: "#ecfdf5",
  blue: "#3b82f6", blueLight: "#eff6ff", purple: "#8b5cf6", purpleLight: "#f5f3ff",
  red: "#ef4444", redLight: "#fef2f2",
};

const CATEGORY_META = [
  { id: "orders", icon: "💳", color: B.blue, bg: B.blueLight },
  { id: "delivery", icon: "🚚", color: B.green, bg: B.greenLight },
  { id: "registration", icon: "🔐", color: B.purple, bg: B.purpleLight },
  { id: "technical", icon: "⚡", color: B.orange, bg: B.orangeLight },
];

const CONTACT_KEYS = ["chat", "email", "whatsapp", "phone"];
const CONTACT_ICONS = { chat: "💬", email: "📧", whatsapp: "📱", phone: "📞" };

/* ── Accordion Item ── */
function FAQItem({ faq, isOpen, onToggle, idx, isMobile }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  // Simple markdown bold
  const renderText = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: B.dark, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{
      border: `1px solid ${isOpen ? B.orange + "40" : B.border}`,
      borderRadius: 12,
      marginBottom: 8,
      background: isOpen ? B.orangeLight + "60" : B.white,
      transition: "all 0.25s ease",
      overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: isMobile ? "14px 14px" : "18px 20px", border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: isOpen ? B.orange : B.light,
            color: isOpen ? B.white : B.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, flexShrink: 0,
            transition: "all 0.25s ease",
          }}>{idx + 1}</span>
          <span style={{
            fontSize: 15, fontWeight: isOpen ? 600 : 500, color: B.text,
            lineHeight: 1.4,
          }}>{faq.q}</span>
        </div>
        <span style={{
          fontSize: 18, color: isOpen ? B.orange : B.muted,
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease", flexShrink: 0,
        }}>+</span>
      </button>
      <div style={{
        height, overflow: "hidden",
        transition: "height 0.3s ease",
      }}>
        <div ref={contentRef} style={{
          padding: isMobile ? "0 14px 14px 14px" : "0 20px 18px 60px",
          fontSize: isMobile ? 13 : 14, lineHeight: 1.75, color: B.muted,
        }}>
          {faq.a.split("\n").map((line, i) => (
            <p key={i} style={{ margin: "0 0 8px" }}>{renderText(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Category Card ── */
function CategoryCard({ cat, label, description, isActive, onClick, count, isMobile, questionsLabel }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: isMobile ? "14px 12px" : "20px 18px", borderRadius: isMobile ? 10 : 14, border: `2px solid ${isActive ? cat.color : B.border}`,
        background: isActive ? cat.bg : hov ? B.light : B.white,
        cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s ease",
        transform: hov && !isActive ? "translateY(-2px)" : "none",
        boxShadow: isActive ? `0 4px 16px ${cat.color}20` : hov ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
        display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: isMobile ? 22 : 28 }}>{cat.icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
          background: isActive ? cat.color + "20" : B.light,
          color: isActive ? cat.color : B.muted,
        }}>{count} {questionsLabel}</span>
      </div>
      <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: B.text }}>{label}</div>
      {!isMobile && <div style={{ fontSize: 12, color: B.muted, lineHeight: 1.5 }}>{description}</div>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function SuntrexHelpCenter() {
  const { t } = useTranslation("pages");
  const [activeCat, setActiveCat] = useState("orders");
  const [openFAQ, setOpenFAQ] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [hovCTA, setHovCTA] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  // Build categories from i18n
  const categories = CATEGORY_META.map(function (meta) {
    var items = t("faq.items." + meta.id, { returnObjects: true });
    return {
      ...meta,
      label: t("faq.categories." + meta.id + ".label"),
      description: t("faq.categories." + meta.id + ".description"),
      faqs: Array.isArray(items) ? items : [],
    };
  });

  // Search logic
  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    var q = search.toLowerCase().trim();
    var results = [];
    categories.forEach(function (cat) {
      cat.faqs.forEach(function (faq, idx) {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          results.push({ ...faq, catId: cat.id, catLabel: cat.label, catIcon: cat.icon, catColor: cat.color, idx: idx });
        }
      });
    });
    setSearchResults(results);
  }, [search, t]);

  var currentCat = categories.find(function (c) { return c.id === activeCat; });
  var isSearching = searchResults !== null;

  // Build contact channels from i18n
  var contactChannels = CONTACT_KEYS.map(function (key) {
    return {
      icon: CONTACT_ICONS[key],
      label: t("faq.contact." + key + ".label"),
      sub: t("faq.contact." + key + ".sub"),
    };
  });

  return (
    <div style={{ minHeight: "100vh", background: B.light, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

      {/* HERO */}
      <div style={{
        background: `linear-gradient(135deg, ${B.dark} 0%, #1a3550 50%, ${B.dark} 100%)`,
        padding: isMobile ? "40px 16px 36px" : "60px 24px 50px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: B.orange + "10" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: B.orange + "08" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px",
            background: "rgba(232,112,10,0.15)", borderRadius: 20, marginBottom: 20,
            border: "1px solid rgba(232,112,10,0.25)",
          }}>
            <span style={{ fontSize: 14 }}>☀️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: B.orange, letterSpacing: "0.5px" }}>{t("faq.badge")}</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800, color: B.white, margin: "0 0 12px", lineHeight: 1.15,
          }}>
            {t("faq.title")}
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.65)", margin: isMobile ? "0 0 24px" : "0 0 32px", lineHeight: 1.6 }}>
            {t("faq.subtitle")}
          </p>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: B.white, borderRadius: 14, padding: "4px 6px 4px 20px",
            maxWidth: 520, margin: "0 auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <span style={{ fontSize: 18, color: B.muted }}>🔍</span>
            <input
              type="text"
              placeholder={t("faq.searchPlaceholder")}
              value={search}
              onChange={function (e) { setSearch(e.target.value); }}
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 15,
                padding: "14px 0", background: "transparent", color: B.text,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {search && (
              <button onClick={function () { setSearch(""); }} style={{
                border: "none", background: B.light, borderRadius: 8,
                padding: "8px 12px", cursor: "pointer", fontSize: 12,
                color: B.muted, fontWeight: 600,
              }}>{t("faq.clear")}</button>
            )}
          </div>

          {isSearching && (
            <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              {t("faq.resultsCount", { count: searchResults.length })}
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "24px 16px 40px" : "40px 20px 60px" }}>

        {/* Search Results */}
        {isSearching ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <span style={{ fontSize: 20 }}>🔍</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: 0 }}>
                {t("faq.resultsFor")} « {search} »
              </h2>
            </div>
            {searchResults.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                background: B.white, borderRadius: 16,
                border: `1px solid ${B.border}`,
              }}>
                <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🔎</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: B.text, margin: "0 0 8px" }}>
                  {t("faq.noResults")}
                </p>
                <p style={{ fontSize: 14, color: B.muted, margin: "0 0 20px" }}>
                  {t("faq.noResultsHint")}
                </p>
                <button
                  onClick={function () { setSearch(""); }}
                  style={{
                    padding: "10px 24px", borderRadius: 10,
                    background: B.orange, color: B.white, border: "none",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >{t("faq.viewAllCategories")}</button>
              </div>
            ) : (
              <div>
                {searchResults.map(function (r, i) {
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        marginBottom: 4, padding: "2px 10px", borderRadius: 12,
                        background: categories.find(function (c) { return c.id === r.catId; })?.bg || B.light,
                        fontSize: 11, fontWeight: 600,
                        color: r.catColor,
                      }}>
                        {r.catIcon} {r.catLabel}
                      </div>
                      <FAQItem
                        faq={r}
                        isOpen={openFAQ === "search-" + i}
                        onToggle={function () { setOpenFAQ(openFAQ === "search-" + i ? null : "search-" + i); }}
                        idx={r.idx}
                        isMobile={isMobile}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Category Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: isMobile ? 8 : 12, marginBottom: isMobile ? 24 : 36,
            }}>
              {categories.map(function (cat) {
                return (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    label={cat.label}
                    description={cat.description}
                    isActive={activeCat === cat.id}
                    onClick={function () { setActiveCat(cat.id); setOpenFAQ(null); }}
                    count={cat.faqs.length}
                    isMobile={isMobile}
                    questionsLabel={t("faq.questions")}
                  />
                );
              })}
            </div>

            {/* Active Category Title */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
              paddingBottom: 16, borderBottom: `2px solid ${currentCat.color}20`,
            }}>
              <span style={{ fontSize: isMobile ? 22 : 28 }}>{currentCat.icon}</span>
              <div>
                <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: B.text, margin: 0 }}>
                  {currentCat.label}
                </h2>
                <p style={{ fontSize: 13, color: B.muted, margin: "2px 0 0" }}>
                  {t("faq.frequentQuestions", { count: currentCat.faqs.length })}
                </p>
              </div>
            </div>

            {/* FAQ Accordions */}
            <div>
              {currentCat.faqs.map(function (faq, idx) {
                return (
                  <FAQItem
                    key={activeCat + "-" + idx}
                    faq={faq}
                    isOpen={openFAQ === activeCat + "-" + idx}
                    onToggle={function () { setOpenFAQ(openFAQ === activeCat + "-" + idx ? null : activeCat + "-" + idx); }}
                    idx={idx}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* CONTACT SECTION */}
        <div style={{
          marginTop: isMobile ? 32 : 48, padding: isMobile ? "24px 16px" : "36px 28px", borderRadius: isMobile ? 14 : 20,
          background: `linear-gradient(135deg, ${B.dark} 0%, #1a3550 100%)`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: B.orange + "15" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: B.white, margin: "0 0 6px" }}>
              {t("faq.contactTitle")}
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>
              {t("faq.contactSubtitle")}
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: 10,
            }}>
              {contactChannels.map(function (ch, i) {
                return (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", gap: 12,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}>
                    <span style={{ fontSize: 22 }}>{ch.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: B.white }}>{ch.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{ch.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: isMobile ? 24 : 32, textAlign: "center", padding: isMobile ? "28px 16px" : "40px 24px",
          background: B.white, borderRadius: 20, border: `1px solid ${B.border}`,
        }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>☀️</span>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: "0 0 8px" }}>
            {t("faq.ctaTitle")}
          </h3>
          <p style={{ fontSize: 14, color: B.muted, margin: "0 0 24px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            {t("faq.ctaSubtitle")}
          </p>
          <button
            onMouseEnter={function () { setHovCTA(true); }}
            onMouseLeave={function () { setHovCTA(false); }}
            style={{
              padding: "14px 36px", borderRadius: 12, border: "none",
              background: hovCTA
                ? `linear-gradient(135deg, ${B.orangeDark}, ${B.orange})`
                : `linear-gradient(135deg, ${B.orange}, ${B.orangeDark})`,
              color: B.white, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              boxShadow: hovCTA ? `0 8px 24px ${B.orange}40` : `0 4px 16px ${B.orange}25`,
              transition: "all 0.25s ease",
              transform: hovCTA ? "translateY(-2px)" : "none",
            }}
          >{t("faq.ctaButton")} →</button>
        </div>
      </div>
    </div>
  );
}
