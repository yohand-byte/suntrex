import { useState, useEffect } from "react";

// Responsive hook — as defined in CLAUDE.md
// Breakpoints: mobile < 768px, tablet 768-1023px, desktop >= 1024px
export const useResponsive = () => {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setW(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
    w,
  };
};
