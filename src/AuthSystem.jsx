import { useState } from "react";

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

const validatePhone = (phone, countryCode) => {
  const cleaned = phone.replace(/\s+/g, " ").trim();
  if (!cleaned) return { valid: false, error: "Numéro de téléphone requis" };
  const cfg = getCountryConfig(countryCode);
  if (!cleaned.startsWith("+")) return { valid: false, error: `Le numéro doit commencer par ${cfg.phonePrefix}` };
  if (!cleaned.startsWith(cfg.phonePrefix) && countryCode !== "OTHER") return { valid: false, error: `Le numéro doit commencer par ${cfg.phonePrefix} pour ${cfg.name}` };
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (digitsOnly.length < 9) return { valid: false, error: "Numéro trop court (minimum 9 chiffres)" };
  if (digitsOnly.length > 15) return { valid: false, error: "Numéro trop long (maximum 15 chiffres)" };
  return { valid: true, error: "" };
};

const validateVat = (vat, countryCode) => {
  const cleaned = vat.replace(/\s+/g, "").toUpperCase();
  if (!cleaned) return { valid: false, error: "N° TVA intracommunautaire requis" };
  const cfg = getCountryConfig(countryCode);
  // Must start with country prefix (except CH which uses CHE)
  const expectedPrefix = countryCode === "CH" ? "CHE" : countryCode;
  if (countryCode !== "OTHER" && !cleaned.startsWith(expectedPrefix)) return { valid: false, error: `Le numéro TVA doit commencer par ${expectedPrefix}` };
  if (cleaned.length < cfg.vatDigits - 3) return { valid: false, error: "Numéro TVA trop court" };
  if (cleaned.length > cfg.vatDigits + 3) return { valid: false, error: "Numéro TVA trop long" };
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

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);

/* ══════════════════════════════════════════════════════
   LOGIN MODAL
   ══════════════════════════════════════════════════════ */
export function LoginModal({ onClose, onLogin, onSwitchToRegister }) {
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
          <h2 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Content de vous revoir</h2>
          <p style={{fontSize:14,color:"#888",marginBottom:0}}>Connectez-vous à votre compte</p>
        </div>
        <div style={S.body}>
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={S.label}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" style={S.input} required/>
            </div>
            <div>
              <label style={S.label}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={S.input} required/>
            </div>
            <div style={{textAlign:"right"}}>
              <a href="#" style={{...S.link,fontSize:13}}>Mot de passe oublié ?</a>
            </div>
            <button type="submit" style={S.btn}>Se connecter</button>
          </form>
          <div style={{...S.divider,margin:"14px 0"}}><div style={S.dividerLine}/><span>ou</span><div style={S.dividerLine}/></div>
          <button onClick={() => window.location.href = "/api/auth/google"} style={{...S.btnOutline,height:42,display:"flex",alignItems:"center",justifyContent:"center",gap:10,borderWidth:1,borderColor:"#ddd",color:"#444",fontSize:14,cursor:"pointer"}}>
            <GoogleIcon/> Se connecter avec Google
          </button>
          <p style={{fontSize:13,color:"#888",textAlign:"center",marginTop:14}}>
            Pas encore de compte ? <span onClick={onSwitchToRegister} style={S.link}>S'inscrire</span>
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
      setSirenError("Entrez un SIRET (14 chiffres) ou SIREN (9 chiffres)");
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
          ? "Aucune entreprise trouvée. Vérifiez votre numéro SIRET/SIREN."
          : "Erreur de connexion. Réessayez ou saisissez manuellement."
      );
    }
    setSirenLoading(false);
  };

  const canNext = () => {
    if (step === 0) {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      return emailValid && form.password.length >= 8 && form.password === form.passwordConfirm && form.consentCGV;
    }
    if (step === 1) {
      const phoneResult = validatePhone(form.phone, form.country);
      const vatResult = validateVat(form.vatNumber, form.country);
      const base = form.companyName.trim() && phoneResult.valid && vatResult.valid && form.country && form.address.trim() && form.postalCode.trim() && form.city.trim();
      if (form.country === "FR") return base && form.siret.replace(/\s/g,"").length >= 9 && sirenVerified;
      return base;
    }
    if (step === 2) return form.kycDocUploaded && form.kycFileName;
    return true;
  };

  const next = () => {
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Format email invalide (ex: nom@entreprise.com)"); return; }
      if (form.password.length < 8) { setError("Minimum 8 caractères pour le mot de passe"); return; }
      if (!/(?=.*[A-Z])(?=.*\d)/.test(form.password)) { setError("Le mot de passe doit contenir au moins 1 majuscule et 1 chiffre"); return; }
      if (form.password !== form.passwordConfirm) { setError("Les mots de passe ne correspondent pas"); return; }
      if (!form.consentCGV) { setError("Acceptez les conditions générales pour continuer"); return; }
    }
    if (step === 1) {
      if (form.country === "FR" && !sirenVerified) { setError("Vérifiez votre SIRET/SIREN avant de continuer"); return; }
      if (!form.companyName.trim()) { setError("Nom d'entreprise requis"); return; }
      const vatResult = validateVat(form.vatNumber, form.country);
      if (!vatResult.valid) { setVatError(vatResult.error); setError(vatResult.error); return; }
      if (!form.address.trim()) { setError("Adresse requise"); return; }
      if (!form.postalCode.trim()) { setError("Code postal requis"); return; }
      if (!form.city.trim()) { setError("Ville requise"); return; }
      const phoneResult = validatePhone(form.phone, form.country);
      if (!phoneResult.valid) { setPhoneError(phoneResult.error); setError(phoneResult.error); return; }
      setPhoneError(""); setVatError("");
    }
    if (step === 2 && !form.kycDocUploaded) { setError("Le document est obligatoire pour finaliser l'inscription"); return; }
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
      setError("Format non accepté. Utilisez PDF, JPG ou PNG.");
      return;
    }

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("Fichier trop volumineux. Maximum 10 Mo.");
      return;
    }

    // Validate file name (not empty/suspicious)
    if (!file.name || file.name.length < 3) {
      setError("Nom de fichier invalide.");
      return;
    }

    setError("");
    update("kycDocUploaded", true);
    update("kycFileName", file.name);
    update("kycFileSize", (file.size / (1024 * 1024)).toFixed(1) + " Mo");
    // Production: upload file to S3/R2 here
  };

  const STEPS = ["Compte", "Entreprise", "Vérification"];

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
              <h3 style={{color:"#fff",fontSize:18,fontWeight:700,marginBottom:8,lineHeight:1.3}}>Rejoignez SUNTREX</h3>
              <p style={{color:"rgba(255,255,255,0.85)",fontSize:12,lineHeight:1.6,marginBottom:20}}>
                La marketplace B2B européenne pour les professionnels du solaire.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>
                {[
                  { icon:"💰", text:"Prix B2B exclusifs" },
                  { icon:"🔍", text:"Comparez des milliers d'offres" },
                  { icon:"🚚", text:"SUNTREX Delivery" },
                  { icon:"🤖", text:"Outils IA intégrés" },
                  { icon:"🔒", text:"Paiements sécurisés Stripe" },
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
                  {step === 0 ? "Créez votre compte" : step === 1 ? "Informations entreprise" : "Justificatif d'entreprise"}
                </h2>
                <p style={{fontSize:12,color:"#888",marginBottom:0}}>
                  {step === 0 ? "Accédez aux prix B2B exclusifs" : step === 1 ? "Vérification de votre statut professionnel" : "Document requis pour activer votre compte"}
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
                  <label style={S.label}>Email professionnel *</label>
                  <input type="email" value={form.email} onChange={e=>update("email",e.target.value)}
                    placeholder="contact@votreentreprise.com" style={S.input}/>
                </div>
                <div>
                  <label style={S.label}>Mot de passe * <span style={{fontWeight:400,color:"#aaa"}}>(min. 8 caractères)</span></label>
                  <input type="password" value={form.password} onChange={e=>update("password",e.target.value)}
                    placeholder="••••••••" style={S.input}/>
                </div>
                <div>
                  <label style={S.label}>Confirmer le mot de passe *</label>
                  <input type="password" value={form.passwordConfirm} onChange={e=>update("passwordConfirm",e.target.value)}
                    placeholder="••••••••" style={S.input}/>
                </div>

                {/* Separator + Google */}
                <div style={{...S.divider,margin:"2px 0"}}><div style={S.dividerLine}/><span>ou</span><div style={S.dividerLine}/></div>
                <button onClick={() => window.location.href = "/api/auth/google"} style={{...S.btnOutline,height:40,display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontSize:13,borderWidth:1,borderColor:"#ddd",color:"#444",cursor:"pointer"}}>
                  <GoogleIcon/> S'inscrire avec Google
                </button>

                {/* RGPD Checkboxes */}
                <div style={{borderTop:"1px solid #f0f0f0",paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                  <label style={{display:"flex",gap:8,cursor:"pointer",alignItems:"flex-start"}}>
                    <input type="checkbox" checked={form.consentCGV} onChange={e=>update("consentCGV",e.target.checked)}
                      style={{marginTop:2,accentColor:"#4CAF50",width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#444",lineHeight:1.5}}>
                      Je comprends et j'accepte les <a href="#" style={{color:"#E8700A"}}>conditions générales</a> et la <a href="#" style={{color:"#E8700A"}}>politique de confidentialité</a>. <span style={{color:"#dc2626"}}>*</span>
                    </span>
                  </label>
                  <label style={{display:"flex",gap:8,cursor:"pointer",alignItems:"flex-start"}}>
                    <input type="checkbox" checked={form.consentMarketing} onChange={e=>update("consentMarketing",e.target.checked)}
                      style={{marginTop:2,accentColor:"#4CAF50",width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#666",lineHeight:1.5}}>
                      Je consens au traitement de mes données à des fins de marketing par SUNTREX.
                    </span>
                  </label>
                  <label style={{display:"flex",gap:8,cursor:"pointer",alignItems:"flex-start"}}>
                    <input type="checkbox" checked={form.consentPartners} onChange={e=>update("consentPartners",e.target.checked)}
                      style={{marginTop:2,accentColor:"#4CAF50",width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#666",lineHeight:1.5}}>
                      Je consens à la réception d'informations commerciales de la part des partenaires SUNTREX.
                    </span>
                  </label>
                </div>

                <button onClick={next} disabled={!canNext()}
                  style={{...S.btn,...(!canNext()?S.btnDisabled:{}),height:44,marginTop:2}}>
                  Continuer →
                </button>
                <p style={{fontSize:12,color:"#888",textAlign:"center",margin:0}}>
                  Déjà un compte ? <span onClick={onSwitchToLogin} style={S.link}>Se connecter</span>
                </p>
              </div>
            )}

            {/* ═══════ STEP 1: Company + SIRET ═══════ */}
            {step === 1 && (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={S.label}>Pays de l'entreprise *</label>
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
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>

                {/* SIRET — France only */}
                {form.country === "FR" && (
                  <div>
                    <label style={S.label}>N° SIRET ou SIREN *</label>
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
                        {sirenLoading ? "⏳" : "🔍 Vérifier"}
                      </button>
                    </div>
                    {sirenVerified && sirenData && (
                      <div style={{marginTop:8,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 12px"}}>
                        <div style={{fontSize:12,color:"#16a34a",fontWeight:600,marginBottom:3}}>✓ Entreprise trouvée</div>
                        <div style={{fontSize:11,color:"#166534",lineHeight:1.5}}>
                          <b>{sirenData.nom_complet}</b><br/>
                          SIREN : {sirenData.siren}
                          {sirenData.siege?.geo_adresse && <><br/>Siège : {sirenData.siege.geo_adresse}</>}
                          {sirenData.siege?.activite_principale && <><br/>NAF : {sirenData.siege.activite_principale}</>}
                        </div>
                      </div>
                    )}
                    {sirenError && (
                      <div style={{marginTop:5,fontSize:11,color:"#dc2626"}}>✕ {sirenError}</div>
                    )}
                  </div>
                )}

                <div>
                  <label style={S.label}>Nom de l'entreprise * {sirenVerified && <span style={{color:"#16a34a",fontWeight:400,fontSize:10}}>✓ vérifié</span>}</label>
                  <input value={form.companyName} onChange={e=>update("companyName",e.target.value)}
                    placeholder="Ex: Solar Pro SARL"
                    style={{...S.input,...(sirenVerified?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                    readOnly={sirenVerified}/>
                </div>

                <div>
                  <label style={S.label}>N° TVA intracommunautaire *</label>
                  <input value={form.vatNumber} onChange={e=>{update("vatNumber",e.target.value.toUpperCase()); setVatError("");}}
                    placeholder={getCountryConfig(form.country).vatPlaceholder}
                    style={{...S.input,...(vatError?{borderColor:"#dc2626",background:"#fef2f2"}:{})}}
                    onBlur={() => { if(form.vatNumber.trim()) { const r = validateVat(form.vatNumber, form.country); if(!r.valid) setVatError(r.error); else setVatError(""); }}}/>
                  {vatError ? (
                    <div style={{fontSize:10,color:"#dc2626",marginTop:2}}>✕ {vatError}</div>
                  ) : (
                    <div style={{fontSize:10,color:"#aaa",marginTop:2}}>Obligatoire pour les transactions B2B intra-européennes. Commence par {form.country === "CH" ? "CHE" : form.country}</div>
                  )}
                </div>

                <div>
                  <label style={S.label}>Adresse *</label>
                  <input value={form.address} onChange={e=>update("address",e.target.value)}
                    placeholder="16-18 rue Eiffel"
                    style={{...S.input,...(sirenVerified&&form.address?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                    readOnly={sirenVerified&&!!form.address}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <label style={S.label}>Code postal *</label>
                    <input value={form.postalCode} onChange={e=>update("postalCode",e.target.value)} placeholder="75017"
                      style={{...S.input,...(sirenVerified&&form.postalCode?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                      readOnly={sirenVerified&&!!form.postalCode}/>
                  </div>
                  <div>
                    <label style={S.label}>Ville *</label>
                    <input value={form.city} onChange={e=>update("city",e.target.value)} placeholder="Paris"
                      style={{...S.input,...(sirenVerified&&form.city?{background:"#f0fdf4",borderColor:"#bbf7d0"}:{})}}
                      readOnly={sirenVerified&&!!form.city}/>
                  </div>
                </div>
                <div>
                  <label style={S.label}>Téléphone *</label>
                  <input value={form.phone} onChange={e=>{
                      const val = formatPhoneInput(e.target.value, form.country);
                      update("phone", val);
                      setPhoneError("");
                    }}
                    placeholder={getCountryConfig(form.country).phonePlaceholder}
                    style={{...S.input,...(phoneError?{borderColor:"#dc2626",background:"#fef2f2"}:{})}}
                    onBlur={() => { if(form.phone.trim()) { const r = validatePhone(form.phone, form.country); if(!r.valid) setPhoneError(r.error); else setPhoneError(""); }}}
                    maxLength={20}/>
                  {phoneError && <div style={{fontSize:10,color:"#dc2626",marginTop:2}}>✕ {phoneError}</div>}
                </div>

                <div style={{display:"flex",gap:10,marginTop:4}}>
                  <button onClick={()=>setStep(0)} style={{...S.btnOutline,flex:1,height:44,fontSize:14}}>← Retour</button>
                  <button onClick={next} disabled={!canNext()} style={{...S.btn,...(!canNext()?S.btnDisabled:{}),flex:2,height:44}}>Continuer →</button>
                </div>
              </div>
            )}

            {/* ═══════ STEP 2: KYC Document (mandatory) ═══════ */}
            {step === 2 && (
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:16}}>🔒</span>
                  <div style={{fontSize:11,color:"#991b1b",lineHeight:1.5}}>
                    <b>Document obligatoire</b> — Votre compte sera activé après vérification de ce document (sous 24h ouvrées). Sans ce document, les prix restent masqués.
                  </div>
                </div>

                {form.kycDocUploaded ? (
                  <div style={{border:"2px solid #4CAF50",borderRadius:12,padding:"24px 20px",textAlign:"center",background:"#f0fdf4"}}>
                    <div style={{fontSize:32,marginBottom:6}}>✅</div>
                    <div style={{fontWeight:600,fontSize:14,color:"#16a34a",marginBottom:3}}>Document sélectionné</div>
                    <div style={{fontSize:12,color:"#555"}}>{form.kycFileName} — {form.kycFileSize || ""}</div>
                    <button onClick={()=>{update("kycDocUploaded",false);update("kycFileName","");update("kycFileSize","")}}
                      style={{marginTop:8,background:"none",border:"1px solid #ddd",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer",color:"#888",fontFamily:"inherit"}}>
                      Changer de fichier
                    </button>
                  </div>
                ) : (
                  <div style={{border:"2px dashed #d0d0d0",borderRadius:12,padding:"28px 20px",textAlign:"center",cursor:"pointer",position:"relative"}}
                    onClick={() => document.getElementById("kyc-file-input")?.click()}>
                    <input id="kyc-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      style={{position:"absolute",opacity:0,width:0,height:0}}/>
                    <div style={{fontSize:36,marginBottom:6}}>📄</div>
                    <div style={{fontWeight:600,fontSize:13,color:"#333",marginBottom:3}}>Cliquez pour choisir un fichier</div>
                    <div style={{fontSize:11,color:"#888"}}>PDF, JPG ou PNG uniquement — max 10 Mo</div>
                  </div>
                )}

                <div style={{background:"#f8f8f8",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#333",marginBottom:6}}>Documents acceptés :</div>
                  {[
                    "Extrait Kbis ou registre du commerce (< 3 mois)",
                    "Attestation de TVA intracommunautaire",
                    "Licence RGE ou certificat professionnel",
                    "Facture fournisseur PV (preuve d'activité solaire)",
                  ].map((doc,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#555",padding:"2px 0"}}>
                      <span style={{color:"#4CAF50"}}>✓</span> {doc}
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setStep(1)} style={{...S.btnOutline,flex:1,height:44,fontSize:14}}>← Retour</button>
                  <button onClick={next} disabled={!canNext()} style={{...S.btn,...(!canNext()?S.btnDisabled:{}),flex:2,height:44}}>Finaliser l'inscription ✓</button>
                </div>
                <div style={{textAlign:"center",fontSize:10,color:"#aaa"}}>🔒 Documents chiffrés et stockés de manière sécurisée</div>
              </div>
            )}

            {/* ═══════ STEP 3: Success ═══════ */}
            {step === 3 && (
              <div style={{textAlign:"center"}}>
                <div style={S.successIcon}>
                  <svg width="32" height="32" fill="none" stroke="#4CAF50" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 6px",color:"#222"}}>Inscription enregistrée ! 🎉</h2>
                <p style={{fontSize:13,color:"#666",lineHeight:1.6,marginBottom:14}}>
                  Votre compte est en cours de vérification.
                </p>

                <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"12px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:12,color:"#92400e",lineHeight:1.6}}>
                    <b>📋 Vérification en cours</b> — Document envoyé, validation sous 24h ouvrées. Les <b>prix restent masqués</b> et les commandes bloquées jusqu'à validation.
                  </div>
                </div>

                <div style={{background:"#f8f8f8",borderRadius:10,padding:"12px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#333",marginBottom:6}}>En attendant :</div>
                  {[
                    { icon:"🔍", text:"Explorer le catalogue et fiches techniques" },
                    { icon:"📊", text:"Comparer les offres entre vendeurs" },
                    { icon:"📄", text:"Télécharger les datasheets" },
                  ].map((item,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#555",padding:"2px 0"}}>
                      <span>{item.icon}</span> {item.text}
                    </div>
                  ))}
                </div>

                <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px",marginBottom:16,textAlign:"left"}}>
                  <div style={{fontSize:11,color:"#1e40af",lineHeight:1.5}}>
                    <b>💡 Vous souhaitez aussi vendre ?</b> Une fois votre compte vérifié, demandez l'accès vendeur depuis <b>Mon Profil → Devenir vendeur</b> (vérification Stripe Connect KYB supplémentaire).
                  </div>
                </div>

                <button onClick={handleFinish} style={S.btn}>Explorer le catalogue →</button>
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
  const [open, setOpen] = useState(false);
  const isSeller = user.role === "seller" || user.role === "both";
  const isPending = user.kycStatus !== "verified";

  const menuItems = [
    { section:"MON PROFIL" },
    { icon:"👤", label:"Détails du compte", action:"profile" },
    { icon:"🔑", label:"Mot de passe", action:"password" },
    { icon:"🏢", label:"Coordonnées entreprise", action:"company" },
    { icon:"📋", label:"Vérification KYC", action:"kyc", badge: isPending?"⏳":"✅" },
    ...(!isSeller ? [{ icon:"📦", label:"Devenir vendeur", action:"become-seller", highlight:true }] : []),
    { section:"ACHETER" },
    { icon:"🛒", label:"Mes achats", action:"purchases" },
    { icon:"📍", label:"Adresses de livraison", action:"addresses" },
    { icon:"📝", label:"Demandes de devis", action:"rfq" },
    ...(isSeller ? [
      { section:"VENDRE" },
      { icon:"📦", label:"Gérer les offres", action:"offers" },
      { icon:"💰", label:"Mes ventes", action:"sales" },
      { icon:"📨", label:"Recevoir des demandes", action:"seller-rfq" },
      { icon:"🏭", label:"Entrepôts", action:"warehouses" },
      { icon:"🚚", label:"Livraison", action:"shipping" },
      { icon:"💳", label:"Modes de paiement", action:"payment-methods" },
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
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#e8f4fd",color:"#1e40af",fontWeight:600}}>Acheteur</span>
                {isSeller && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#fff3e0",color:"#e65100",fontWeight:600}}>Vendeur</span>}
                {isPending && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#fef2f2",color:"#dc2626",fontWeight:600}}>⏳ Vérification</span>}
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
                <span>🚪</span> Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
