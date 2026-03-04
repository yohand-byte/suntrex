import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

function FloatingField({ label, value, onChange, type = "text", hint }) {
  const [foc, setFoc] = useState(false);
  const has = value != null && String(value).length > 0;
  return (
    <div style={{ position: "relative" }}>
      <input type={type} value={value || ""} onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{
          width: "100%", boxSizing: "border-box", height: 52, padding: "22px 14px 8px",
          border: `1.5px solid ${foc ? T.accent : T.border}`, borderRadius: T.radiusSm,
          fontSize: 14, fontFamily: T.font, color: T.text, background: "#fff", outline: "none",
          transition: T.transitionFast, boxShadow: foc ? `0 0 0 3px ${T.accent}10` : "none",
        }} />
      <span style={{
        position: "absolute", left: 14, top: has || foc ? 7 : 16,
        fontSize: has || foc ? 10.5 : 14, fontWeight: has || foc ? 600 : 400,
        color: foc ? T.accent : has ? T.accent : T.textMuted,
        pointerEvents: "none", transition: "all .2s",
      }}>{label}</span>
      {hint && <div style={{ fontSize: 11.5, color: T.red, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export default function PasswordTab() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();

  const [old, setOld] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState(false);

  const valid = old.length > 0 && pw.length >= 8 && pw === confirm;
  const mismatch = confirm.length > 0 && pw !== confirm;
  const tooShort = pw.length > 0 && pw.length < 8;

  const save = () => {
    if (!valid) return;
    setOld(""); setPw(""); setConfirm("");
    setToast(true); setTimeout(() => setToast(false), 2500);
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: T.text, fontFamily: T.font, margin: "0 0 24px" }}>
        {lang === "fr" ? "Mot de passe" : "Profile Password"}
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        <FloatingField label={lang === "fr" ? "Ancien mot de passe" : "Old password"} value={old} onChange={setOld} type={show ? "text" : "password"} />
        <FloatingField label={lang === "fr" ? "Nouveau mot de passe" : "New password"} value={pw} onChange={setPw} type={show ? "text" : "password"}
          hint={tooShort ? (lang === "fr" ? "8 caractères minimum" : "Minimum 8 characters") : null} />
        <FloatingField label={lang === "fr" ? "Confirmer le mot de passe" : "Confirm password"} value={confirm} onChange={setConfirm} type={show ? "text" : "password"}
          hint={mismatch ? (lang === "fr" ? "Les mots de passe ne correspondent pas" : "Passwords do not match") : null} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.textSec, cursor: "pointer", marginBottom: 22, fontFamily: T.font }}>
        <input type="checkbox" checked={show} onChange={() => setShow(!show)} style={{ accentColor: T.accent }} />
        {lang === "fr" ? "Afficher les mots de passe" : "Show passwords"}
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={save} disabled={!valid} style={{
          padding: "10px 22px", background: valid ? T.accent : T.textMuted, color: "#fff", border: "none",
          borderRadius: T.radiusSm, fontSize: 13.5, fontWeight: 700, cursor: valid ? "pointer" : "default",
          fontFamily: T.font, transition: T.transitionFast, opacity: valid ? 1 : 0.6,
        }}>{lang === "fr" ? "Enregistrer" : "Save changes"}</button>
        <button onClick={() => { setOld(""); setPw(""); setConfirm(""); }} style={{
          padding: "10px 22px", background: "transparent", color: T.textSec,
          border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
          fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
        }}>{lang === "fr" ? "Annuler" : "Cancel"}</button>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          padding: "12px 24px", background: "#1b1e2b", color: "#fff", borderRadius: 10,
          fontSize: 13, fontWeight: 600, fontFamily: T.font, boxShadow: T.shadowLg,
          display: "flex", alignItems: "center", gap: 8, zIndex: 999,
        }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>✓</span>
          {lang === "fr" ? "Mot de passe mis à jour" : "Password updated"}
        </div>
      )}
    </div>
  );
}
