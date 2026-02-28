import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import SuntrexSupportChat from "./components/chat/SuntrexSupportChat";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPageV2";
import TransactionChatPage from "./pages/TransactionChatPage";
import BuyerDashboard from "./components/dashboard/BuyerDashboard";
import SellerDashboard from "./components/dashboard/SellerDashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DeliveryTrackerPage from "./pages/DeliveryTrackerPage";
import CheckoutPage from "./pages/CheckoutPage";
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
  const isDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const handleLogout = () => { setIsLoggedIn(false); setCurrentUser(null); navigate("/"); };

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#262627",minHeight:"100vh"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet"/>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{overflow-x:hidden}
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
        @media(max-width:767px){
          .hl:hover{transform:none;box-shadow:none}
          .hide-mobile{display:none!important}
          nav::-webkit-scrollbar{display:none}
        }
        @media(min-width:768px) and (max-width:1023px){
          .hide-tablet{display:none!important}
        }
      `}</style>

      {!isDashboard && (
        <Header
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onShowLogin={()=>setShowLogin(true)}
          onShowRegister={()=>setShowRegister(true)}
          onLogout={handleLogout}
        />
      )}

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
        <Route path="/checkout/:productId" element={
          <CheckoutPage
            isLoggedIn={isVerified}
            onLogin={()=>setShowRegister(true)}
          />
        }/>
        <Route path="/delivery/:orderId" element={<DeliveryTrackerPage />} />
        }/>
        <Route path="/transaction/:id" element={
          <TransactionChatPage
            isLoggedIn={isVerified}
            currentUser={currentUser}
          />
        }/>
        <Route path="/dashboard" element={<DashboardLayout />} />
        <Route path="/dashboard/buy" element={<DashboardLayout initialTab="buy" />} />
        <Route path="/dashboard/sell" element={<DashboardLayout initialTab="sell" />} />
        <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
        <Route path="/dashboard/seller" element={<SellerDashboard />} />
      </Routes>

      {!isDashboard && <Footer />}
      {!isDashboard && <SuntrexSupportChat userId={isLoggedIn ? "current-user-id" : null} />}

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
