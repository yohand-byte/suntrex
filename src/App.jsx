import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ChatFab from "./components/layout/ChatFab";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { LoginModal, RegisterModal } from "./AuthSystem";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — App Shell (Router + Layout)
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isVerified = isLoggedIn && currentUser?.kycStatus === "verified";

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const handleLogout = () => { setIsLoggedIn(false); setCurrentUser(null); navigate("/"); };

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#262627",minHeight:"100vh"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet"/>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dotPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
        .fade-in{animation:fadeIn .4s ease-out forwards}
        .marquee{animation:marquee 25s linear infinite}.marquee:hover{animation-play-state:paused}
        .hl{transition:transform .2s,box-shadow .2s}.hl:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.08)}
        .ar{animation:slideUp .5s ease-out both}
        .ar:nth-child(1){animation-delay:.1s}.ar:nth-child(2){animation-delay:.3s}
        .ar:nth-child(3){animation-delay:.5s}.ar:nth-child(4){animation-delay:.7s}
      `}</style>

      <Header
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onShowLogin={()=>setShowLogin(true)}
        onShowRegister={()=>setShowRegister(true)}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={
          <HomePage
            isVerified={isVerified}
            isLoggedIn={isLoggedIn}
            onShowRegister={()=>setShowRegister(true)}
            navigate={navigate}
          />
        }/>
        <Route path="/catalog/:category?" element={
          <CatalogPage
            isLoggedIn={isVerified}
            onLogin={()=>setShowRegister(true)}
          />
        }/>
        <Route path="/product/:id" element={
          <ProductDetailPage
            isLoggedIn={isVerified}
            onLogin={()=>setShowRegister(true)}
          />
        }/>
      </Routes>

      <Footer />
      <ChatFab />

      {showLogin && (
        <LoginModal
          onClose={()=>setShowLogin(false)}
          onLogin={(user)=>{setCurrentUser(user);setIsLoggedIn(true);setShowLogin(false)}}
          onSwitchToRegister={()=>{setShowLogin(false);setShowRegister(true)}}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={()=>setShowRegister(false)}
          onRegister={(user)=>{setCurrentUser(user);setIsLoggedIn(true);setShowRegister(false)}}
          onSwitchToLogin={()=>{setShowRegister(false);setShowLogin(true)}}
        />
      )}
    </div>
  );
}
