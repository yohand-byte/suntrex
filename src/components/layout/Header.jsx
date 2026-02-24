import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserMenu } from "../../AuthSystem";

const NAV_ITEMS = [
  { label: "Tous les produits", path: "/catalog" },
  { label: "Panneaux solaires", path: "/catalog/panels" },
  { label: "Onduleurs", path: "/catalog/inverters" },
  { label: "Stockage d'énergie", path: "/catalog/batteries" },
  { label: "Optimiseurs", path: "/catalog/optimizers" },
  { label: "Électrotechnique", path: null },
  { label: "E-mobilité", path: null },
];

export default function Header({ isLoggedIn, currentUser, onShowLogin, onShowRegister, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      {/* TOP BAR */}
      <div style={{ background: "#1a1a1a", color: "#fff", fontSize: 12, padding: "6px 40px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 20, opacity: .7 }}>
          {["À propos", "Blog", "FAQ"].map(l => <a key={l} href="#" style={{ color: "#fff", textDecoration: "none" }}>{l}</a>)}
        </div>
        <span style={{ opacity: .7 }}>+33 1 XX XX XX XX</span>
      </div>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "#fff", borderBottom: "1px solid #e4e5ec", padding: "0 40px", height: 56, display: "flex", alignItems: "center", gap: 24 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer", textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#E8700A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>suntrex</span>
        </Link>
        <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
          <input placeholder="Rechercher un produit ou fabricant..." style={{ width: "100%", height: 36, borderRadius: 6, border: "1px solid #d3d4db", padding: "0 36px 0 12px", fontSize: 13, outline: "none" }} />
          <button style={{ position: "absolute", right: 1, top: 1, bottom: 1, width: 34, borderRadius: "0 5px 5px 0", border: "none", background: "#E8700A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <span style={{ fontSize: 13, cursor: "pointer" }}>EUR</span>
          {isLoggedIn && currentUser ? (
            <>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#7b7b7b", position: "relative" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              </button>
              <UserMenu user={currentUser} onLogout={onLogout} onNavigate={(p) => { navigate("/" + p) }} />
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#7b7b7b" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={onShowLogin} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#555" }}>Se connecter</button>
              <button onClick={onShowRegister} style={{ background: "#E8700A", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#fff", fontWeight: 600 }}>S'inscrire</button>
            </>
          )}
        </div>
      </header>

      {/* NAV */}
      <nav style={{ borderBottom: "1px solid #e4e5ec", padding: "0 40px", height: 40, display: "flex", alignItems: "center", background: "#fff" }}>
        {NAV_ITEMS.map((item, i) => {
          const isActive = item.path && location.pathname === item.path;
          return (
            <button key={item.label} onClick={() => { if (item.path) navigate(item.path) }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 14px", height: 40, border: "none", background: "none", fontSize: 13, color: isActive ? "#E8700A" : i === 0 && isHome ? "#4CAF50" : "#7b7b7b", fontWeight: isActive || (i === 0 && isHome) ? 600 : 400, cursor: item.path ? "pointer" : "default", borderBottom: isActive ? "2px solid #E8700A" : i === 0 && isHome ? "2px solid #4CAF50" : "2px solid transparent", whiteSpace: "nowrap", fontFamily: "inherit", opacity: item.path ? 1 : .5 }}>
              {item.label}{i > 0 && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>}
            </button>
          );
        })}
        <Link to="/catalog" style={{ marginLeft: "auto", fontSize: 13, color: "#E8700A", textDecoration: "none", fontWeight: 500 }}>Vendre sur suntrex</Link>
      </nav>

      {/* Verification pending banner */}
      {isLoggedIn && currentUser && currentUser.kycStatus !== "verified" && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 40px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16 }}>⏳</span>
          <div style={{ fontSize: 13, color: "#92400e", flex: 1 }}>
            <b>Vérification en cours</b> — Votre compte est en attente de validation. Les prix et commandes seront débloqués après vérification de votre dossier (sous 24h ouvrées).
          </div>
          <button onClick={() => navigate("/dashboard")} style={{ background: "#E8700A", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Voir mon statut
          </button>
        </div>
      )}
    </>
  );
}
