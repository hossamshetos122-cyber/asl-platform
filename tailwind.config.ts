import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0d14",
          deep: "#060810",
        },
        surface: {
          DEFAULT: "#111827",
          elevated: "#1a2332",
          raised2: "#243040",
        },
        line: "rgba(255,255,255,0.06)",
        "line-gold": "rgba(212,168,67,0.35)",
        "line-strong": "rgba(255,255,255,0.10)",
        gold: {
          DEFAULT: "#d4a843",
          bright: "#e8c05a",
          dim: "#b08d2f",
          faint: "rgba(212,168,67,0.06)",
        },
        navy: {
          DEFAULT: "#1b2540",
          light: "#243052",
        },
        live: "#ef4444",
        emerald: {
          DEFAULT: "#22c55e",
          400: "#4ade80",
        },
        text: {
          DEFAULT: "#f0f0f0",
          dim: "#8a919e",
          dimmer: "#555d6e",
          faint: "#333b4a",
        },
      },
      fontFamily: {
        display: ["var(--font-alexandria)", "sans-serif"],
        body: ["var(--font-tajawal)", "sans-serif"],
        utility: ["var(--font-anton)", "sans-serif"],
        num: ["var(--font-rajdhani)", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(212,168,67,0.12)",
        "glow-sm": "0 0 10px rgba(212,168,67,0.08)",
        "glow-lg": "0 0 40px rgba(212,168,67,0.15), 0 0 80px rgba(212,168,67,0.06)",
        deep: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
        elevated: "0 4px 20px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.18)",
        card: "0 2px 8px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
