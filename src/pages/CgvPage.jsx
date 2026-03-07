import { useTranslation } from "react-i18next";
import useResponsive from "../hooks/useResponsive";

const BRAND = { orange: "#E8700A", dark: "#0F1923", muted: "#64748b", light: "#f8fafc", border: "#e2e8f0" };
const SECTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const COMMISSION_DATA = [
  ["cat1", "0,80%", "1,24%", "1,72%", "2,15%", "2,62%", "2,84%"],
  ["cat2", "0,98%", "1,70%", "2,48%", "2,98%", "3,47%", "3,79%"],
  ["cat3", "1,13%", "1,96%", "2,86%", "3,45%", "4,00%", "4,64%"],
];
const HEADERS = ["> 150k", "80-150k", "25-80k", "10-25k", "5-10k", "< 5k"];

export default function CgvPage() {
  const { t } = useTranslation("pages");
  const { isMobile } = useResponsive();

  const sectionStyle = { marginBottom: 32 };
  const h2Style = { fontSize: isMobile ? 17 : 20, fontWeight: 700, color: BRAND.dark, marginBottom: 10 };
  const pStyle = { fontSize: 15, color: BRAND.muted, lineHeight: 1.7 };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: BRAND.dark, marginBottom: 8 }}>{t("cgv.title")}</h1>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 32 }}>{t("cgv.lastUpdate")}</p>

      {/* Table of contents */}
      <nav style={{ background: BRAND.light, borderRadius: 10, padding: isMobile ? 16 : 20, marginBottom: 40, border: `1px solid ${BRAND.border}` }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>{t("cgv.tocTitle")}</h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6 }}>
          {SECTIONS.map((n) => (
            <button key={n} onClick={() => scrollTo(`cgv-s${n}`)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 0", fontSize: 14, color: BRAND.orange, fontFamily: "inherit" }}>
              {t(`cgv.s${n}.title`)}
            </button>
          ))}
        </div>
      </nav>

      {/* Sections */}
      {SECTIONS.map((n) => (
        <div key={n} id={`cgv-s${n}`} style={sectionStyle}>
          <h2 style={h2Style}>{t(`cgv.s${n}.title`)}</h2>
          <p style={pStyle}>{t(`cgv.s${n}.text`)}</p>

          {/* Commission table for section 4 */}
          {n === 4 && (
            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 12 : 14, minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: `2px solid ${BRAND.dark}`, fontWeight: 700, color: BRAND.dark }}></th>
                    {HEADERS.map((h) => (
                      <th key={h} style={{ textAlign: "center", padding: "10px 6px", borderBottom: `2px solid ${BRAND.dark}`, fontWeight: 600, color: BRAND.dark, whiteSpace: "nowrap" }}>{h} &euro;</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMMISSION_DATA.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : BRAND.light }}>
                      <td style={{ padding: "10px 8px", fontWeight: 600, color: BRAND.dark, whiteSpace: "nowrap" }}>{t(`cgv.commissionCat${ri + 1}`)}</td>
                      {row.slice(1).map((val, ci) => (
                        <td key={ci} style={{ textAlign: "center", padding: "10px 6px", color: BRAND.muted }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 12, fontStyle: "italic" }}>{t("cgv.commissionNote")}</p>
            </div>
          )}
        </div>
      ))}

      <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 40, borderTop: `1px solid ${BRAND.border}`, paddingTop: 20 }}>
        {t("cgv.lastUpdate")} — <a href="mailto:contact@suntrex.eu" style={{ color: BRAND.orange }}>contact@suntrex.eu</a>
      </p>
    </div>
  );
}
