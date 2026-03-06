import { useState, useCallback, useRef } from "react";
import useResponsive from "../../hooks/useResponsive";
import { supabase } from "../../lib/supabase";

const REQUIRED_COLS = ["SKU", "Product Name", "Brand", "Price EUR HT", "Stock"];
const ALL_COLS = ["SKU", "Product Name", "Brand", "Price EUR HT", "Stock", "Min Order", "Lead Time (days)", "Country", "Warehouse"];

const STEPS = [
  { label: "Telecharger le template", icon: "📥" },
  { label: "Importer le fichier", icon: "📤" },
  { label: "Verification", icon: "🔍" },
  { label: "Confirmation", icon: "✅" },
];

function validateRow(row, idx) {
  const errors = [];
  if (!row["SKU"]) errors.push(`Ligne ${idx + 1}: SKU manquant`);
  if (!row["Product Name"]) errors.push(`Ligne ${idx + 1}: Nom produit manquant`);
  const price = parseFloat(row["Price EUR HT"]);
  if (isNaN(price) || price <= 0) errors.push(`Ligne ${idx + 1}: Prix invalide`);
  const stock = parseInt(row["Stock"]);
  if (isNaN(stock) || stock < 0) errors.push(`Ligne ${idx + 1}: Stock invalide`);
  return errors;
}

export default function BulkImport() {
  const { isMobile } = useResponsive();
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const pad = isMobile ? 16 : 32;

  const parseFile = useCallback(async (file) => {
    if (!file) return;
    const XLSX = (await import("xlsx"));
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws);

    if (!json.length) {
      setErrors(["Fichier vide"]);
      return;
    }

    // Validate columns
    const cols = Object.keys(json[0]);
    const missing = REQUIRED_COLS.filter(c => !cols.includes(c));
    if (missing.length) {
      setErrors([`Colonnes manquantes: ${missing.join(", ")}`]);
      return;
    }

    // Validate rows
    const allErrors = [];
    json.forEach((row, i) => allErrors.push(...validateRow(row, i)));

    setRows(json);
    setErrors(allErrors);
    setStep(2);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      parseFile(file);
    }
  }, [parseFile]);

  const handleFileChange = useCallback((e) => {
    parseFile(e.target.files?.[0]);
  }, [parseFile]);

  const handleImport = useCallback(async () => {
    if (!supabase || errors.length > 0) return;
    setImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get seller company
      const { data: company } = await supabase
        .from("Company")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      const listings = rows.map(row => ({
        product_name: row["Product Name"],
        sku: row["SKU"],
        brand: row["Brand"] || null,
        price: parseFloat(row["Price EUR HT"]),
        currency: "EUR",
        stock: parseInt(row["Stock"]) || 0,
        min_order: parseInt(row["Min Order"]) || 1,
        lead_time_days: parseInt(row["Lead Time (days)"]) || null,
        country: row["Country"] || null,
        warehouse: row["Warehouse"] || null,
        seller_company_id: company?.id || null,
        seller_id: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
      }));

      const { data: inserted, error } = await supabase
        .from("Listing")
        .insert(listings)
        .select("id");

      if (error) throw error;

      setResult({ success: true, count: inserted?.length || listings.length });
      setStep(3);
    } catch (err) {
      setResult({ success: false, error: err.message });
      setStep(3);
    } finally {
      setImporting(false);
    }
  }, [rows, errors]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f7f8fa", minHeight: "100vh", padding: `${pad}px` }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>Import d'offres en masse</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Importez vos produits via fichier XLSX</p>
        </div>

        {/* Steps Progress */}
        <div style={{ display: "flex", gap: isMobile ? 4 : 8, marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "10px 8px", borderRadius: 8, textAlign: "center",
              background: i <= step ? "#E8700A" : "#fff", color: i <= step ? "#fff" : "#94a3b8",
              border: `1px solid ${i <= step ? "#E8700A" : "#e2e8f0"}`, transition: "all 0.2s",
            }}>
              <div style={{ fontSize: isMobile ? 16 : 20 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Step 0: Download template */}
        {step === 0 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: pad }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>1. Telecharger le template</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Remplissez le fichier XLSX avec vos offres. Colonnes obligatoires : SKU, Product Name, Brand, Price EUR HT, Stock.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="/templates/suntrex-offer-template.xlsx"
                download
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px",
                  background: "#E8700A", color: "#fff", borderRadius: 8, textDecoration: "none",
                  fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                }}
              >
                📥 Telecharger le template XLSX
              </a>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: "12px 24px", background: "#f1f5f9", color: "#1e293b", borderRadius: 8,
                  border: "1px solid #e2e8f0", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                J'ai deja mon fichier →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: pad }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>2. Importer votre fichier</h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#E8700A" : "#e2e8f0"}`,
                borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer",
                background: dragOver ? "#fff7ed" : "#f8fafc", transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                Glissez votre fichier XLSX ici
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>ou cliquez pour parcourir</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
            {errors.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview & Validate */}
        {step === 2 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: pad }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                3. Verification — {rows.length} produit{rows.length > 1 ? "s" : ""}
              </h2>
              {errors.length === 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "#ecfdf5", padding: "4px 10px", borderRadius: 20 }}>
                  Tout est valide
                </span>
              )}
            </div>

            {errors.length > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>
                <strong>{errors.length} erreur{errors.length > 1 ? "s" : ""} :</strong>
                {errors.slice(0, 10).map((e, i) => <div key={i}>{e}</div>)}
                {errors.length > 10 && <div>... et {errors.length - 10} autres</div>}
              </div>
            )}

            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {ALL_COLS.map(c => (
                      <th key={c} style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0", fontSize: 10, whiteSpace: "nowrap" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {ALL_COLS.map(c => (
                        <td key={c} style={{ padding: "6px", color: "#1e293b", whiteSpace: "nowrap" }}>
                          {row[c] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>... et {rows.length - 20} autres lignes</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleImport}
                disabled={errors.length > 0 || importing}
                style={{
                  padding: "12px 28px", borderRadius: 8, border: "none", cursor: errors.length > 0 ? "not-allowed" : "pointer",
                  background: errors.length > 0 ? "#94a3b8" : "#10b981", color: "#fff",
                  fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  opacity: importing ? 0.6 : 1,
                }}
              >
                {importing ? "Import en cours..." : `Importer ${rows.length} produit${rows.length > 1 ? "s" : ""}`}
              </button>
              <button
                onClick={() => { setStep(1); setRows([]); setErrors([]); }}
                style={{
                  padding: "12px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
                  color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Recommencer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div style={{
            background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: pad,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{result.success ? "🎉" : "❌"}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: result.success ? "#10b981" : "#ef4444", marginBottom: 8 }}>
              {result.success ? "Import reussi !" : "Erreur d'import"}
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
              {result.success
                ? `${result.count} offre${result.count > 1 ? "s" : ""} importee${result.count > 1 ? "s" : ""} avec succes.`
                : result.error
              }
            </p>
            <button
              onClick={() => { setStep(0); setRows([]); setErrors([]); setResult(null); }}
              style={{
                padding: "12px 28px", borderRadius: 8, border: "none", background: "#E8700A",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Nouvel import
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
