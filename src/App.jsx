import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import PageMeta from "./components/seo/PageMeta";
import { LoginModal, RegisterModal } from "./AuthSystem";
import { supabase } from "./lib/supabase";

// Lazy-loaded pages and heavy components (code splitting)
const SuntrexSupportChat = lazy(() => import("./components/chat/SuntrexSupportChat"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const TransactionChatPage = lazy(() => import("./pages/TransactionChatPage"));
const BuyerDashboard = lazy(() => import("./components/dashboard/BuyerDashboard"));
const SellerDashboard = lazy(() => import("./components/dashboard/SellerDashboard"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const DeliveryTrackerPage = lazy(() => import("./pages/DeliveryTrackerPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const SuntrexHelpCenter = lazy(() => import("./components/faq/SuntrexFAQ"));
const MvpTracker = lazy(() => import("./pages/MvpTracker"));
const SellerProfile = lazy(() => import("./pages/seller/SellerProfile"));
const AuthE2ETest = lazy(() => import("./tests/AuthE2ETest"));
const StripeE2ETest = lazy(() => import("./tests/StripeE2ETest"));

// Loading spinner for Suspense fallback
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 44, height: 44, border: "3px solid #f0f1f5", borderTopColor: "#E8700A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ marginTop: 16, fontSize: 14, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>Chargement...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — App Shell (Router + Layout)
   ═══════════════════════════════════════════════════════════════ */

// Build a user object from Supabase session user
function buildUserFromSession(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    name: meta.company_name || meta.first_name || user.email?.split("@")[0] || "",
    company: meta.company_name || "",
    role: meta.role || "buyer",
    kycStatus: meta.kyc_status || "pending_review",
    country: meta.country || "FR",
  };
}

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

  // Restore session on mount + listen for auth changes
  useEffect(() => {
    if (!supabase) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(buildUserFromSession(session.user));
        setIsLoggedIn(true);
      }
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setCurrentUser(buildUserFromSession(session.user));
        setIsLoggedIn(true);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => { subscription?.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate("/");
  };

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
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-in{animation:fadeIn .4s ease-out forwards}
        .marquee{animation:marquee 30s linear infinite;will-change:transform;transform:translateZ(0)}.marquee:hover{animation-play-state:paused}
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

      <PageMeta path={location.pathname} />

      {!isDashboard && (
        <Header
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onShowLogin={()=>setShowLogin(true)}
          onShowRegister={()=>setShowRegister(true)}
          onLogout={handleLogout}
        />
      )}

      <Suspense fallback={<LoadingSpinner />}>
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
          <Route path="/checkout/:productId" element={
            <CheckoutPage
              isLoggedIn={isVerified}
              onLogin={()=>setShowRegister(true)}
            />
          }/>
          <Route path="/delivery/:orderId" element={<DeliveryTrackerPage />} />
          <Route path="/transaction/:id" element={
            <TransactionChatPage
              isLoggedIn={isVerified}
              currentUser={currentUser}
            />
          }/>
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/faq" element={<SuntrexHelpCenter />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tracker" element={<MvpTracker />} />
          <Route path="/admin/auth-test" element={<AuthE2ETest />} />
          <Route path="/admin/stripe-test" element={<StripeE2ETest />} />
          <Route path="/dashboard" element={<DashboardLayout />} />
          <Route path="/dashboard/buy" element={<DashboardLayout initialTab="buy" />} />
          <Route path="/dashboard/sell" element={<DashboardLayout initialTab="sell" />} />
          <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
          <Route path="/dashboard/seller" element={<SellerProfile />} />
        </Routes>
      </Suspense>

      {!isDashboard && <Footer />}
      {!isDashboard && <SuntrexSupportChat userId={isLoggedIn ? currentUser?.id || null : null} />}

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
