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
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 border-b ${
        scrolled
          ? "bg-bg/90 border-accent/20 shadow-deep"
          : "bg-bg/70 border-white/[0.06]"
      }`}
    >
      {children}
    </nav>
  );
}