import { useState } from "react";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════════════
   SUNTREX — Auth System v2
   - Login modal
   - Registration 3 steps (all users register as BUYER):
     Step 0: Account (email, password) + RGPD consent + Google
     Step 1: Company info with SIRET/SIREN auto-fill via API
     Step 2: KYC document upload (mandatory)
     Step 3: Success (pending verification)
   - Becoming a seller = separate flow from profile after buyer KYC
   - API: recherche-entreprises.api.gouv.fr (free, no key needed)
   ═══════════════════════════════════════════════════════════ */

const COUNTRIES = [
  { code:"FR", name:"France", flag:"🇫🇷", phonePrefix:"+33", phonePlaceholder:"+33 6 12 34 56 78", phoneRegex:/^\+33\s?[1-9](\s?\d{2}){4}$/, vatRegex:/^FR\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/, vatPlaceholder:"FR XX XXXXXXXXX", vatDigits:13 },
  { code:"DE", name:"Allemagne", flag:"🇩🇪", phonePrefix:"+49", phonePlaceholder:"+49 151 1234 5678", phoneRegex:/^\+49\s?\d[\d\s]{8,14}$/, vatRegex:/^DE\s?\d{9}$/, vatPlaceholder:"DE XXXXXXXXX", vatDigits:11 },
  { code:"BE", name:"Belgique", flag:"🇧🇪", phonePrefix:"+32", phonePlaceholder:"+32 470 12 34 56", phoneRegex:/^\+32\s?\d[\d\s]{7,12}$/, vatRegex:/^BE\s?0?\d{9,10}$/, vatPlaceholder:"BE 0XXX.XXX.XXX", vatDigits:12 },
  { code:"NL", name:"Pays-Bas", flag:"🇳🇱", phonePrefix:"+31", phonePlaceholder:"+31 6 1234 5678", phoneRegex:/^\+31\s?\d[\d\s]{7,12}$/, vatRegex:/^NL\s?\d{9}B\d{2}$/, vatPlaceholder:"NL XXXXXXXXXBXX", vatDigits:14 },
  { code:"IT", name:"Italie", flag:"🇮🇹", phonePrefix:"+39", phonePlaceholder:"+39 312 345 6789", phoneRegex:/^\+39\s?\d[\d\s]{8,13}$/, vatRegex:/^IT\s?\d{11}$/, vatPlaceholder:"IT XXXXXXXXXXX", vatDigits:13 },
  { code:"ES", name:"Espagne", flag:"🇪🇸", phonePrefix:"+34", phonePlaceholder:"+34 612 34 56 78", phoneRegex:/^\+34\s?\d[\d\s]{7,12}$/, vatRegex:/^ES\s?[A-Z0-9]\d{7}[A-Z0-9]$/, vatPlaceholder:"ES XXXXXXXXX", vatDigits:11 },
  { code:"CH", name:"Suisse", flag:"🇨🇭", phonePrefix:"+41", phonePlaceholder:"+41 76 123 45 67", phoneRegex:/^\+41\s?\d[\d\s]{7,12}$/, vatRegex:/^CHE\s?\d{3}\.\d{3}\.\d{3}\s?(TVA|MWST|IVA)$/, vatPlaceholder:"CHE XXX.XXX.XXX TVA", vatDigits:15 },
  { code:"AT", name:"Autriche", flag:"🇦🇹", phonePrefix:"+43", phonePlaceholder:"+43 664 123 4567", phoneRegex:/^\+43\s?\d[\d\s]{7,12}$/, vatRegex:/^ATU\s?\d{8}$/, vatPlaceholder:"ATU XXXXXXXX", vatDigits:11 },
  { code:"PL", name:"Pologne", flag:"🇵🇱", phonePrefix:"+48", phonePlaceholder:"+48 512 345 678", phoneRegex:/^\+48\s?\d[\d\s]{7,12}$/, vatRegex:/^PL\s?\d{10}$/, vatPlaceholder:"PL XXXXXXXXXX", vatDigits:12 },
  { code:"PT", name:"Portugal", flag:"🇵🇹", phonePrefix:"+351", phonePlaceholder:"+351 912 345 678", phoneRegex:/^\+351\s?\d[\d\s]{7,12}$/, vatRegex:/^PT\s?\d{9}$/, vatPlaceholder:"PT XXXXXXXXX", vatDigits:11 },
  { code:"LU", name:"Luxembourg", flag:"🇱🇺", phonePrefix:"+352", phonePlaceholder:"+352 621 123 456", phoneRegex:/^\+352\s?\d[\d\s]{6,11}$/, vatRegex:/^LU\s?\d{8}$/, vatPlaceholder:"LU XXXXXXXX", vatDigits:10 },
  { code:"GB", name:"Royaume-Uni", flag:"🇬🇧", phonePrefix:"+44", phonePlaceholder:"+44 7911 123456", phoneRegex:/^\+44\s?\d[\d\s]{8,13}$/, vatRegex:/^GB\s?\d{9}(\d{3})?$/, vatPlaceholder:"GB XXXXXXXXX", vatDigits:11 },
  { code:"OTHER", name:"Autre pays européen", flag:"🇪🇺", phonePrefix:"+", phonePlaceholder:"+XX XXX XXX XXXX", phoneRegex:/^\+\d[\d\s]{8,16}$/, vatRegex:/^[A-Z]{2}\s?\w{4,15}$/, vatPlaceholder:"XX XXXXXXXXX", vatDigits:8 },
];

/* ── Validation helpers ── */
const getCountryConfig = (code) => COUNTRIES.find(c => c.code === code) || COUNTRIES[COUNTRIES.length - 1];

const validatePhone = (t, phone, countryCode) => {
  const cleaned = phone.replace(/\s+/g, " ").trim();
  if (!cleaned) return { valid: false, error: t("auth.validation.phoneRequired") };
  const cfg = getCountryConfig(countryCode);
  if (!cleaned.startsWith("+")) return { valid: false, error: t("auth.validation.phoneMustStartWith", { prefix: cfg.phonePrefix }) };
  if (!cleaned.startsWith(cfg.phonePrefix) && countryCode !== "OTHER") return { valid: false, error: t("auth.validation.phoneMustStartWithForCountry", { prefix: cfg.phonePrefix, country: t("auth.countries." + countryCode) }) };
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (digitsOnly.length < 9) return { valid: false, error: t("auth.validation.phoneTooShort") };
  if (digitsOnly.length > 15) return { valid: false, error: t("auth.validation.phoneTooLong") };
  return { valid: true, error: "" };
};

const validateVat = (t, vat, countryCode) => {
  const cleaned = vat.replace(/\s+/g, "").toUpperCase();
  if (!cleaned) return { valid: false, error: t("auth.validation.vatRequired") };
  const cfg = getCountryConfig(countryCode);
  // Must start with country prefix (except CH which uses CHE)
  const expectedPrefix = countryCode === "CH" ? "CHE" : countryCode;
  if (countryCode !== "OTHER" && !cleaned.startsWith(expectedPrefix)) return { valid: false, error: t("auth.validation.vatMustStartWith", { prefix: expectedPrefix }) };
  if (cleaned.length < cfg.vatDigits - 3) return { valid: false, error: t("auth.validation.vatTooShort") };
  if (cleaned.length > cfg.vatDigits + 3) return { valid: false, error: t("auth.validation.vatTooLong") };
  return { valid: true, error: "" };
};

const formatPhoneInput = (value, countryCode) => {
  // Auto-prepend country prefix if user types digits directly
  const cfg = getCountryConfig(countryCode);
  if (value && !value.startsWith("+") && value.length > 0) {
    return cfg.phonePrefix + " " + value;
  }
  return value;
};

/* ── Shared Styles ── */
const S = {
  overlay: { position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(2px)" },
  modal: { background:"#fff", borderRadius:20, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.25)", position:"relative" },
  header: { padding:"28px 36px 0", textAlign:"center" },
  logo: { display:"inline-flex", alignItems:"center", gap:8, marginBottom:16 },
  logoIcon: { width:36, height:36, borderRadius:8, background:"#E8700A", display:"flex", alignItems:"center", justifyContent:"center" },
  body: { padding:"20px 36px 28px" },
  input: { width:"100%", height:44, borderRadius:10, border:"1px solid #d3d4db", padding:"0 14px", fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif", transition:"border-color .2s", boxSizing:"border-box" },
  label: { fontSize:13, fontWeight:500, color:"#444", marginBottom:6, display:"block" },
  btn: { width:"100%", height:46, borderRadius:10, border:"none", background:"#E8700A", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .2s" },
  btnOutline: { width:"100%", height:46, borderRadius:10, border:"2px solid #E8700A", background:"#fff", color:"#E8700A", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnDisabled: { opacity:0.5, cursor:"not-allowed" },
  link: { color:"#E8700A", textDecoration:"none", fontWeight:500, cursor:"pointer" },
  close: { position:"absolute", top:16, right:18, background:"none", border:"none", fontSize:18, color:"#bbb", cursor:"pointer", zIndex:2 },
  divider: { display:"flex", alignItems:"center", gap:12, fontSize:12, color:"#aaa", margin:"4px 0" },
  dividerLine: { flex:1, height:1, background:"#e8e8e8" },
  successIcon: { width:64, height:64, borderRadius:"50%", background:"#e8f5e9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" },
};

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
);


/* ══════════════════════════════════════════════════════
   LOGIN MODAL
   ══════════════════════════════════════════════════════ */
export function LoginModal({ onClose, onLogin, onSwitchToRegister }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email, name: email.split("@")[0], company: "Demo Co", role: "buyer", kycStatus: "verified", country: "FR" });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{...S.modal, width:440}} onClick={e=>e.stopPropagation()}>
        <button style={S.close} onClick={onClose}>✕</button>
        <div style={S.header}>
          <div style={S.logo}>
            <div style={S.logoIcon}><SunIcon/></div>
            <span style={{fontWeight:700,fontSize:20}}>suntrex</span>
          </div>
          <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>{t("auth.login.title")}</h2>
          <p style={{fontSize:14,color:"#888",marginBottom:0}}>{t("auth.login.subtitle")}</p>
        </div>
        <div style={S.body}>
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={S.label}>{t("auth.login.email")}</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("auth.login.emailPlaceholder")} style={S.input} required/>
            </div>
            <div>
              <label style={S.label}>{t("auth.login.password")}</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t("auth.login.passwordPlaceholder")} style={S.input} required/>
            </div>
            <div style={{textAlign:"right"}}>
              <a href="#" style={{...S.link,fontSize:13}}>{t("auth.login.forgotPassword")}</a>
            </div>
            <button type="submit" style={S.btn}>{t("auth.login.submit")}</button>
          </form>
          <p style={{fontSize:13,color:"#888",textAlign:"center",marginTop:14}}>
            {t("auth.login.noAccount")} <span onClick={onSwitchToRegister} style={S.link}>{t("auth.login.signUp")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   REGISTER MODAL — 4 steps, buyer only
   ══════════════════════════════════════════════════════ */
export function RegisterModal({ onClose, onRegister, onSwitchToLogin }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "", password: "", passwordConfirm: "",
    siret: "", companyName: "", vatNumber: "",
    country: "FR", address: "", city: "", postalCode: "", phone: "",
    kycDocUploaded: false, kycFileName: "",
    consentCGV: false, consentMarketing: false, consentPartners: false,
  });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [vatError, setVatError] = useState("");
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenVerified, setSirenVerified] = useState(false);
  const [sirenError, setSirenError] = useState("");
  const [sirenData, setSirenData] = useState(null);
  const fileInputRef = { current: null };

  const update = (key, val) => { setForm(prev => ({...prev, [key]: val})); setError(""); };

  /* ── SIRET/SIREN API: recherche-entreprises.api.gouv.fr (free, no key) ── */
  const lookupSiret = async () => {
    const cleaned = form.siret.replace(/\s/g, "");
    if (cleaned.length < 9) {
      setSirenError(t("auth.validation.siretMinLength"));
      return;
    }
    setSirenLoading(true);
    setSirenError("");
    setSirenVerified(false);
    setSirenData(null);
    try {
      const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleaned}`);
      if (!res.ok) throw new Error("api_error");
      const data = await res.json();
      if (!data.results || data.results.length === 0) throw new Error("not_found");

      const company = data.results[0];
      const siege = company.siege;

      setSirenData(company);
      setSirenVerified(true);
      setForm(prev => ({
        ...prev,
        companyName: company.nom_complet || company.nom_raison_sociale || prev.companyName,
        address: siege?.geo_adresse || prev.address,
        postalCode: siege?.code_postal || prev.postalCode,
        city: siege?.libelle_commune || prev.city,
      }));
    } catch (err) {
      setSirenError(
        err.message === "not_found"
          ? t("auth.validation.siretNotFound")
          : t("auth.validation.siretApiError")
      );
    }
    setSirenLoading(false);
  };

  /* ── Password strength rules ── */
  const pwRules = [
    { label: t("auth.passwordRules.minChars"), test: form.password.length >= 8 },
    { label: t("auth.passwordRules.uppercase"), test: /[A-Z]/.test(form.password) },
    { label: t("auth.passwordRules.lowercase"), test: /[a-z]/.test(form.password) },
    { label: t("auth.passwordRules.digit"), test: /[0-9]/.test(form.password) },
    { label: t("auth.passwordRules.special"), test: /[!@#$%^&*]/.test(form.password) },
  ];
  const pwScore = pwRules.filter(r => r.test).length;
  const pwAllValid = pwScore === 5;
  const pwMatch = form.password.length > 0 && form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;
  const pwStrength = pwScore <= 1 ? { label: t("auth.passwordStrength.weak"), color: "#dc2626" }
    : pwScore <= 3 ? { label: t("auth.passwordStrength.medium"), color: "#f59e0b" }
    : pwScore === 4 ? { label: t("auth.passwordStrength.strong"), color: "#84cc16" }
    : { label: t("auth.passwordStrength.veryStrong"), color: "#4CAF50" };

  const canNext = () => {
    if (step === 0) {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      return emailValid && pwAllValid && pwMatch && form.consentCGV;
    }
    if (step === 1) {
      const phoneResult = validatePhone(t, form.phone, form.country);
      const vatResult = validateVat(t, form.vatNumber, form.country);
      const base = form.companyName.trim() && phoneResult.valid && vatResult.valid && form.country && form.address.trim() && form.postalCode.trim() && form.city.trim();
      if (form.country === "FR") return base && form.siret.replace(/\s/g,"").length >= 9 && sirenVerified;
      return base;
    }
    if (step === 2) return form.kycDocUploaded && form.kycFileName;
    return true;
  };

  const next = () => {
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError(t("auth.validation.emailInvalid")); return; }
      if (!pwAllValid) { setError(t("auth.validation.passwordRulesNotMet")); return; }
      if (!pwMatch) { setError(t("auth.validation.passwordsMismatch")); return; }
      if (!form.consentCGV) { setError(t("auth.validation.consentRequired")); return; }
    }
    if (step === 1) {
      if (form.country === "FR" && !sirenVerified) { setError(t("auth.validation.siretVerifyFirst")); return; }
      if (!form.companyName.trim()) { setError(t("auth.validation.companyNameRequired")); return; }
      const vatResult = validateVat(t, form.vatNumber, form.country);
      if (!vatResult.valid) { setVatError(vatResult.error); setError(vatResult.error); return; }
      if (!form.address.trim()) { setError(t("auth.validation.addressRequired")); return; }
      if (!form.postalCode.trim()) { setError(t("auth.validation.postalCodeRequired")); return; }
      if (!form.city.trim()) { setError(t("auth.validation.cityRequired")); return; }
      const phoneResult = validatePhone(t, form.phone, form.country);
      if (!phoneResult.valid) { setPhoneError(phoneResult.error); setError(phoneResult.error); return; }
      setPhoneError(""); setVatError("");
    }
    if (step === 2 && !form.kycDocUploaded) { setError(t("auth.validation.kycRequired")); return; }
    setError("");
    if (step < 3) setStep(step + 1);
  };

  const handleFinish = () => {
    onRegister({
      email: form.email, name: form.companyName, company: form.companyName,
      role: "buyer", kycStatus: "pending_review",
      country: form.country, vatNumber: form.vatNumber, siret: form.siret, sirenVerified,
    });
  };

  const handleFileSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError(t("auth.validation.fileFormatInvalid"));
      return;
    }

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(t("auth.validation.fileTooLarge"));
      return;
    }

    // Validate file name (not empty/suspicious)
    if (!file.name || file.name.length < 3) {
      setError(t("auth.validation.fileNameInvalid"));
      return;
    }

    setError("");
    update("kycDocUploaded", true);
    update("kycFileName", file.name);
    update("kycFileSize", (file.size / (1024 * 1024)).toFixed(1) + " Mo");
    // Production: upload file to S3/R2 here
  };

  const STEPS = [t("auth.register.steps.account"), t("auth.register.steps.company"), t("auth.register.steps.verification")];

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{
        ...S.modal,
        width: step === 3 ? 440 : step === 0 ? 780 : 480,
        display: step === 0 ? "flex" : "block",
      }} onClick={e=>e.stopPropagation()}>

        {/* ── Side panel (step 0 only) ── */}
        {step === 0 && (
          <div style={{
            width: 300, flexShrink: 0,
            background: "linear-gradient(160deg, #E8700A 0%, #c45a00 100%)",
            borderRadius: "20px 0 0 20px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "36px 24px",
          }}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:14}}>☀️</div>
              <h3 style={{color:"#fff",fontSize:18,fontWeight:700,marginBottom:8,lineHeight:1.3}}>{t("auth.sidePanel.joinSuntrex")}</h3>
              <p style={{color:"rgba(255,255,255,0.85)",fontSize:12,lineHeight:1.6,marginBottom:20}}>
                {t("auth.sidePanel.subtitle")}
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
                {[
                  { icon:"💰", text: t("auth.sidePanel.exclusiveB2B") },
                  { icon:"🔍", text: t("auth.sidePanel.compareThousands") },
                  { icon:"🚚", text: t("auth.sidePanel.suntrexDelivery") },
                  { icon:"🤖", text: t("auth.sidePanel.aiTools") },
                  { icon:"🔒", text: t("auth.sidePanel.securePayments") },
                ].map((item,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.9)",fontSize:11}}>
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
              <div style={{marginTop:20,display:"flex",flexWrap:"wrap",justifyContent:"center",gap:5}}>
                {["Huawei","Jinko","LONGi","Trina","BYD","Deye","SMA"].map(b => (
                  <span key={b} style={{fontSize:8,color:"rgba(255,255,255,0.65)",padding:"2px 5px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:3}}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Main form ── */}
        <div style={{flex:1, minWidth:0}}>
          <button style={S.close} onClick={onClose}>✕</button>

          <div style={S.header}>
            <div style={S.logo}>
              <div style={S.logoIcon}><SunIcon/></div>
              <span style={{fontWeight:700,fontSize:20}}>suntrex</span>
            </div>
            {step < 3 && (
              <>
                <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:12}}>
                  {STEPS.map((s,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{
                        width:i===step?24:8, height:8, borderRadius:4,
                        background: i < step ? "#4CAF50" : i === step ? "#E8700A" : "#e0e0e0",
                        transition: "all .3s",
                      }}/>
                    </div>
                  ))}
                </div>
                <h2 style={{fontSize:19,fontWeight:700,margin:"0 0 3px"}}>
                  {step === 0 ? t("auth.register.step0.title") : step === 1 ? t("auth.register.step1.title") : t("auth.register.step2.title")}
                </h2>
                <p style={{fontSize:12,color:"#888",marginBottom:0}}>
                  {step === 0 ? t("auth.register.step0.subtitle") : step === 1 ? t("auth.register.step1.subtitle") : t("auth.register.step2.subtitle")}
                </p>
              </>
            )}
          </div>

          <div style={S.body}>
            {error && (
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#dc2626"}}>
                ✕ {error}
              </div>
            )}

            {/* ═══════ STEP 0: Account ═══════ */}
            {step === 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={S.label}>{t("auth.register.step0.professionalEmail")}</label>
                  <input type="email" value={form.email} onChange={e=>update("email",e.target.value)}
                    placeholder={t("auth.register.step0.emailPlaceholder")} style={S.input}/>
                </div>
                <div>
                  <label style={S.label}>{t("auth.register.step0.password")}</label>
                  <input type="password" value={form.password} onChange={e=>update("password",e.target.value)}
                    placeholder="••••••••" style={S.input}/>
                  {/* Password rules checklist */}
                  {form.password.length > 0 && (
                    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:3}}>
                      {pwRules.map((rule,i) => (
                        <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:rule.test?"#16a34a":"#dc2626"}}>
                          <span>{rule.test ? "✅" : "❌"}</span> {rule.label}
                        </div>
                      ))}
                      {/* Strength bar */}
                      <div style={{marginTop:4}}>
                        <div style={{height:6,borderRadius:3,background:"#e8e8e8",overflow:"hidden"}}>
                          <div style={{
                            height:"100%",borderRadius:3,
                            width:`${pwScore*20}%`,
                            background:pwStrength.color,
                            transition:"width .3s, background .3s",
                          }}/>
                        </div>
                        <div style={{fontSize:11,fontWeight:600,color:pwStrength.color,marginTop:3}}>{pwStrength.label}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label style={S.label}>{t("auth.register.step0.confirmPassword")}</label>
                  <input type="password" value={form.passwordConfirm} onChange={e=>update("passwordConfirm",e.target.value)}
                    placeholder="••••••••" style={{
                      ...S.input,
                      ...(form.passwordConfirm.length > 0 ? {
                        borderColor: pwMatch ? "#4CAF50" : "#dc2626",
                      } : {}),
                    }}/>
                  {form.passwordConfirm.length > 0 && (
                    pwMatch ? (
                      <div style={{fontSize:11,color:"#16a34a",marginTop:3}}>{t("auth.validation.passwordsMatch")}</div>
                    ) : (
                      <div style={{fontSize:11,color:"#dc2626",marginTop:3}}>{t("auth.validation.passwordsMismatch")}</div>
                    )
                  )}
                </div>

                {/* RGPD Checkboxes */}
                <div style={{borderTop:"1px solid #f0f0f0",paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                  <label style={{display:"flex",gap:8,cursor:"pointer",alignItems:"flex-start"}}>
                    <input type="checkbox" checked={form.consentCGV} onChange={e=>update("consentCGV",e.target.checked)}
                      style={{marginTop:2,accentColor:"#4CAF50",width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#444",lineHeight:1.5}}>
                      {t("auth.consent.terms")} <a href="#" style={{color:"#E8700A"}}>{t("auth.consent.termsLink")}</a> {t("auth.consent.and")} <a href="#" style={{color:"#E8700A"}}>{t("auth.consent.privacyLink")}</a>. <span style={{color:"#dc2626"}}>*</span>
                    </span>
                  </label>
                  <label style={{display:"flex",gap:8,cursor:"pointer",alignItems:"flex-start"}}>
                    <input type="checkbox" checked={form.consentMarketing} onChange={e=>update("consentMarketing",e.target.checked)}
                      style={{marginTop:2,accentColor:"#4CAF50",width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#666",lineHeight:1.5}}>
                      {t("auth.consent.marketing")}
                    </span>
                  </label>
                  <label style={{display:"flex",gap:8,cursor:"pointer",alignItems:"flex-start"}}>
                    <input type="checkbox" checked={form.consentPartners} onChange={e=>update("consentPartners",e.target.checked)}
                      style={{marginTop:2,accentColor:"#4CAF50",width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#666",lineHeight:1.5}}>
                      {t("auth.consent.partners")}
                    </span>
                  </label>
                </div>

                <button onClick={next} disabled={!canNext()}
                  style={{...S.btn,...(!canNext()?S.btnDisabled:{}),height:44,marginTop:2}}>
                  {t("auth.register.step0.continue")}
                </button>
                <p style={{fontSize:12,color:"#888",textAlign:"center",margin:0}}>
                  {t("auth.register.step0.alreadyAccount")} <span onClick={onSwitchToLogin} style={S.link}>{t("auth.register.step0.login")}</span>
                </p>
              </div>
            )}

            {/* ═══════ STEP 1: Company + SIRET ═══════ */}
            {step === 1 && (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={S.label}>{t("auth.register.step1.companyCountry")}</label>
                  <select value={form.country} onChange={e=>{
                    const newCountry = e.target.value;
                    const cfg = getCountryConfig(newCountry);
                    update("country",newCountry);
                    update("phone", cfg.phonePrefix + " ");
                    update("vatNumber", "");
                    setPhoneError(""); setVatError("");
                    setSirenVerified(false);setSirenError("");setSirenData(null);
                  }}
                    style={{...S.input,cursor:"pointer",appearance:"auto"}}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {t("auth.countries." + c.code)}</option>)}
                  </select>
                </div>

                {/* SIRET — France only */}
                {form.country === "FR" && (
                  <div>
                    <label style={S.label}>{t("auth.register.step1.siretLabel")}</label>
                    <div style={{display:"flex",gap:8}}>
                      <input value={form.siret}
                        onChange={e=>{update("siret",e.target.value);setSirenVerified(false);setSirenError("");setSirenData(null)}}
                        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();lookupSiret()}}}
                        placeholder="Ex: 853 655 363 00036"
                        style={{...S.input,flex:1,...(sirenVerified?{borderColor:"#4CAF50",background:"#f0fdf4"}:sirenError?{borderColor:"#dc2626",background:"#fef2f2"}:{})}}
                        maxLength={20}/>
                      <button onClick={lookupSiret}
                        disabled={sirenLoading || form.siret.replace(/\s/g,"").length < 9}
                        style={{
                          height:44,padding:"0 16px",borderRadius:10,border:"none",
                          background:sirenLoading?"#f5f5f5":"#E8700A",color:sirenLoading?"#888":"#fff",
                          fontSize:13,fontWeight:600,cursor:sirenLoading?"wait":"pointer",
                          fontFamily:"inherit",whiteSpace:"nowrap",
                          opacity:form.siret.replace(/\s/g,"").length<9?0.4:1,
                        }}>
                        {sirenLoading ? "⏳" : "🔍 " + t("auth.register.step1.verify")}
                      </button>
                    </div>
                    {sirenVerified && sirenData && (
                      <div style={{marginTop:8,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 12px"}}>
                        <div style={{fontSize:12,color:"#16a34a",fontWeight:600,marginBottom:3}}>✓ {t("auth.register.step1.companyFound")}</div>
                        <div style={{fontSize:11,color:"#166534",lineHeight:1.5}}>
                          <b>{sirenData.nom_complet}</b><br/>
                          {t("auth.register.step1.siren")} : {sirenData.siren}
                          {sirenData.siege?.geo_adresse && <><br/>{t("auth.register.step1.headquarters")} : {sirenData.siege.geo_adresse}</>}
                          {sirenData.siege?.activite_principale && <><br/>{t("auth.register.step1.naf")} : {sirenData.siege.activite_principale}</>}
                        </div>
                      </div>
                    )}
                    {sirenError && (
                      <div style={{marginTop:5,fontSize:11,color:"#dc2626"}}>✕ {sirenError}</div>
                    )}
                  </div>
                )}

                <div>
                  <label style={S.label}>{t("auth.register.step1.companyName")} {sirenVerified && <span style={{color:"#16a34a",fontWeight:400,fontSize:10}}>✓ {t("auth.register.step1.verified")}</span>}</label>
                  <input value={form.companyName} onChange={e=>update("companyName",e.target.value)}
                    placeholder="Ex: Solar Pro SARL"
                    style={{...S.input,...(sirenVerified?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                    readOnly={sirenVerified}/>
                </div>

                <div>
                  <label style={S.label}>{t("auth.register.step1.vatNumber")}</label>
                  <input value={form.vatNumber} onChange={e=>{update("vatNumber",e.target.value.toUpperCase()); setVatError("");}}
                    placeholder={getCountryConfig(form.country).vatPlaceholder}
                    style={{...S.input,...(vatError?{borderColor:"#dc2626",background:"#fef2f2"}:{})}}
                    onBlur={() => { if(form.vatNumber.trim()) { const r = validateVat(t, form.vatNumber, form.country); if(!r.valid) setVatError(r.error); else setVatError(""); }}}/>
                  {vatError ? (
                    <div style={{fontSize:10,color:"#dc2626",marginTop:2}}>✕ {vatError}</div>
                  ) : (
                    <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{t("auth.register.step1.vatHint")} {form.country === "CH" ? "CHE" : form.country}</div>
                  )}
                </div>

                <div>
                  <label style={S.label}>{t("auth.register.step1.address")}</label>
                  <input value={form.address} onChange={e=>update("address",e.target.value)}
                    placeholder="16-18 rue Eiffel"
                    style={{...S.input,...(sirenVerified&&form.address?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                    readOnly={sirenVerified&&!!form.address}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <label style={S.label}>{t("auth.register.step1.postalCode")}</label>
                    <input value={form.postalCode} onChange={e=>update("postalCode",e.target.value)} placeholder="75017"
                      style={{...S.input,...(sirenVerified&&form.postalCode?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                      readOnly={sirenVerified&&!!form.postalCode}/>
                  </div>
                  <div>
                    <label style={S.label}>{t("auth.register.step1.city")}</label>
                    <input value={form.city} onChange={e=>update("city",e.target.value)} placeholder="Paris"
                      style={{...S.input,...(sirenVerified&&form.city?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                      readOnly={sirenVerified&&!!form.city}/>
                  </div>
                </div>
                <div>
                  <label style={S.label}>{t("auth.register.step1.phone")}</label>
                  <input value={form.phone} onChange={e=>{
                      const val = formatPhoneInput(e.target.value, form.country);
                      update("phone", val);
                      setPhoneError("");
                    }}
                    placeholder={getCountryConfig(form.country).phonePlaceholder}
                    style={{...S.input,...(phoneError?{borderColor:"#dc2626",background:"#fef2f2"}:{})}}
                    onBlur={() => { if(form.phone.trim()) { const r = validatePhone(t, form.phone, form.country); if(!r.valid) setPhoneError(r.error); else setPhoneError(""); }}}
                    maxLength={20}/>
                  {phoneError && <div style={{fontSize:10,color:"#dc2626",marginTop:2}}>✕ {phoneError}</div>}
                </div>

                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button onClick={()=>setStep(0)} style={{...S.btnOutline,flex:1,height:44,fontSize:14}}>{t("auth.register.step1.back")}</button>
                  <button onClick={next} disabled={!canNext()} style={{...S.btn,...(!canNext()?S.btnDisabled:{}),flex:2,height:44}}>{t("auth.register.step1.continue")}</button>
                </div>
              </div>
            )}

            {/* ═══════ STEP 2: KYC Document (mandatory) ═══════ */}
            {step === 2 && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:16}}>🔒</span>
                  <div style={{fontSize:11,color:"#991b1b",lineHeight:1.5}}>
                    <b>{t("auth.register.step2.mandatoryDoc")}</b> — {t("auth.register.step2.mandatoryDocDesc")}
                  </div>
                </div>

                {form.kycDocUploaded ? (
                  <div style={{border:"2px solid #4CAF50",borderRadius:12,padding:"24px 20px",textAlign:"center",background:"#f0fdf4"}}>
                    <div style={{fontSize:32,marginBottom:6}}>✅</div>
                    <div style={{fontWeight:600,fontSize:14,color:"#16a34a",marginBottom:3}}>{t("auth.register.step2.documentSelected")}</div>
                    <div style={{fontSize:12,color:"#555"}}>{form.kycFileName} — {form.kycFileSize || ""}</div>
                    <button onClick={()=>{update("kycDocUploaded",false);update("kycFileName","");update("kycFileSize","")}}
                      style={{marginTop:8,background:"none",border:"1px solid #ddd",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer",color:"#888",fontFamily:"inherit"}}>
                      {t("auth.register.step2.changeFile")}
                    </button>
                  </div>
                ) : (
                  <div style={{border:"2px dashed #d0d0d0",borderRadius:12,padding:"28px 20px",textAlign:"center",cursor:"pointer",position:"relative"}}
                    onClick={() => document.getElementById("kyc-file-input")?.click()}>
                    <input id="kyc-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      style={{position:"absolute",opacity:0,width:0,height:0}}/>
                    <div style={{fontSize:36,marginBottom:6}}>📄</div>
                    <div style={{fontWeight:600,fontSize:13,color:"#333",marginBottom:3}}>{t("auth.register.step2.clickToChoose")}</div>
                    <div style={{fontSize:11,color:"#888"}}>{t("auth.register.step2.fileFormats")}</div>
                  </div>
                )}

                <div style={{background:"#f8f8f8",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#333",marginBottom:6}}>{t("auth.register.step2.acceptedDocs")}</div>
                  {[
                    t("auth.register.step2.kbisExtract"),
                    t("auth.register.step2.vatCertificate"),
                    t("auth.register.step2.rgeLicense"),
                    t("auth.register.step2.pvInvoice"),
                  ].map((doc,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#555",padding:"2px 0"}}>
                      <span style={{color:"#4CAF50"}}>✓</span> {doc}
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setStep(1)} style={{...S.btnOutline,flex:1,height:44,fontSize:14}}>{t("auth.register.step2.back")}</button>
                  <button onClick={next} disabled={!canNext()} style={{...S.btn,...(!canNext()?S.btnDisabled:{}),flex:2,height:44}}>{t("auth.register.step2.finalize")}</button>
                </div>
                <div style={{textAlign:"center",fontSize:10,color:"#aaa"}}>{t("auth.register.step2.secureStorage")}</div>
              </div>
            )}

            {/* ═══════ STEP 3: Success ═══════ */}
            {step === 3 && (
              <div style={{textAlign:"center"}}>
                <div style={S.successIcon}>
                  <svg width="32" height="32" fill="none" stroke="#4CAF50" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 6px",color:"#222"}}>{t("auth.register.step3.title")}</h2>
                <p style={{fontSize:13,color:"#666",lineHeight:1.6,marginBottom:14}}>
                  {t("auth.register.step3.subtitle")}
                </p>

                <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"12px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:12,color:"#92400e",lineHeight:1.6}}>
                    <b>{t("auth.register.step3.verificationInProgress")}</b> — {t("auth.register.step3.verificationDesc")}
                  </div>
                </div>

                <div style={{background:"#f8f8f8",borderRadius:10,padding:"12px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#333",marginBottom:6}}>{t("auth.register.step3.meanwhile")}</div>
                  {[
                    { icon:"🔍", text: t("auth.register.step3.exploreCatalog") },
                    { icon:"📊", text: t("auth.register.step3.compareOffers") },
                    { icon:"📄", text: t("auth.register.step3.downloadDatasheets") },
                  ].map((item,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#555",padding:"2px 0"}}>
                      <span>{item.icon}</span> {item.text}
                    </div>
                  ))}
                </div>

                <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:11,color:"#1e40af",lineHeight:1.5}}>
                    <b>{t("auth.register.step3.wantToSell")}</b> {t("auth.register.step3.wantToSellDesc")}
                  </div>
                </div>

                <button onClick={handleFinish} style={S.btn}>{t("auth.register.step3.exploreCatalogBtn")}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   USER MENU (header dropdown)
   ══════════════════════════════════════════════════════ */
export function UserMenu({ user, onLogout, onNavigate }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isSeller = user.role === "seller" || user.role === "both";
  const isPending = user.kycStatus !== "verified";

  const menuItems = [
    { section: t("auth.userMenu.sections.myProfile") },
    { icon:"👤", label: t("auth.userMenu.accountDetails"), action:"profile" },
    { icon:"🔑", label: t("auth.userMenu.password"), action:"password" },
    { icon:"🏢", label: t("auth.userMenu.companyDetails"), action:"company" },
    { icon:"📋", label: t("auth.userMenu.kycVerification"), action:"kyc", badge: isPending?"⏳":"✅" },
    ...(!isSeller ? [{ icon:"📦", label: t("auth.userMenu.becomeSeller"), action:"become-seller", highlight:true }] : []),
    { section: t("auth.userMenu.sections.buy") },
    { icon:"🛒", label: t("auth.userMenu.myPurchases"), action:"purchases" },
    { icon:"📍", label: t("auth.userMenu.deliveryAddresses"), action:"addresses" },
    { icon:"📝", label: t("auth.userMenu.quoteRequests"), action:"rfq" },
    ...(isSeller ? [
      { section: t("auth.userMenu.sections.sell") },
      { icon:"📦", label: t("auth.userMenu.manageOffers"), action:"offers" },
      { icon:"💰", label: t("auth.userMenu.mySales"), action:"sales" },
      { icon:"📨", label: t("auth.userMenu.receiveRequests"), action:"seller-rfq" },
      { icon:"🏭", label: t("auth.userMenu.warehouses"), action:"warehouses" },
      { icon:"🚚", label: t("auth.userMenu.shipping"), action:"shipping" },
      { icon:"💳", label: t("auth.userMenu.paymentMethods"), action:"payment-methods" },
    ] : []),
  ];

  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:4}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700}}>
          {(user.company||user.name||"U")[0].toUpperCase()}
        </div>
        <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setOpen(false)}/>
          <div style={{position:"absolute",top:"100%",right:0,marginTop:8,width:260,background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",zIndex:100,overflow:"hidden",maxHeight:"70vh",overflowY:"auto"}}>
            <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f0f0f0"}}>
              <div style={{fontWeight:600,fontSize:14,color:"#222"}}>{user.company||user.name}</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{user.email}</div>
              <div style={{display:"flex",gap:5,marginTop:6}}>
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#e8f4fd",color:"#1e40af",fontWeight:600}}>{t("auth.userMenu.buyer")}</span>
                {isSeller && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#fff3e0",color:"#e65100",fontWeight:600}}>{t("auth.userMenu.seller")}</span>}
                {isPending && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#fef2f2",color:"#dc2626",fontWeight:600}}>{t("auth.userMenu.verification")}</span>}
              </div>
            </div>
            {menuItems.map((item,i) => {
              if (item.section) return <div key={i} style={{padding:"10px 16px 3px",fontSize:9,fontWeight:700,color:"#aaa",letterSpacing:1,textTransform:"uppercase"}}>{item.section}</div>;
              return (
                <button key={i} onClick={()=>{setOpen(false);onNavigate?.(item.action)}}
                  style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 16px",border:"none",background:item.highlight?"#fff8f0":"none",cursor:"pointer",fontSize:13,color:item.highlight?"#E8700A":"#444",fontFamily:"inherit",textAlign:"left",fontWeight:item.highlight?600:400}}>
                  <span style={{fontSize:14}}>{item.icon}</span>
                  <span style={{flex:1}}>{item.label}</span>
                  {item.badge && <span style={{fontSize:11}}>{item.badge}</span>}
                  {item.highlight && <span style={{fontSize:9,background:"#E8700A",color:"#fff",padding:"1px 5px",borderRadius:3}}>NEW</span>}
                </button>
              );
            })}
            <div style={{borderTop:"1px solid #f0f0f0",padding:"6px 0"}}>
              <button onClick={()=>{setOpen(false);onLogout()}}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,color:"#dc2626",fontFamily:"inherit"}}>
                <span>🚪</span> {t("auth.userMenu.logout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
