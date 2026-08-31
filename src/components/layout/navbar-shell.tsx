"use client";

import { useState, useEffect } from "react";

export function NavbarShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="القائمة الرئيسية"
      className={`sticky top-0 z-50 backdrop-blur-lg transition-all duration-300 ${
        scrolled
          ? "bg-[#0a203c]/95 border-b border-accent/20 shadow-deep"
          : "bg-[#0d1830]/90 border-b border-white/10"
      }`}
    >
      {children}
    </nav>
  );
}