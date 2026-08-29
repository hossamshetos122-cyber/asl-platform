import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#150324",
          deep: "#0B0116",
        },
        surface: {
          DEFAULT: "#1E0734",
          elevated: "#2A0D48",
          raised2: "#3A175F",
        },
        purple: {
          DEFAULT: "#37003C",
          bright: "#963CFF",
          dim: "#290431",
        },
        live: "#E90052",
        accent: {
          DEFAULT: "#E90052",
          bright: "#FF2E77",
          dim: "#C00048",
          faint: "rgba(233,0,82,0.08)",
        },
        success: {
          DEFAULT: "#00FF87",
          bright: "#5CFFAE",
        },
        emerald: {
          DEFAULT: "#00FF87",
          400: "#00FF87",
          500: "#00FF87",
        },
        cyan: "#00F0FF",
        line: "rgba(255,255,255,0.07)",
        "line-accent": "rgba(233,0,82,0.40)",
        "line-strong": "rgba(255,255,255,0.12)",
        navy: {
          DEFAULT: "#37003C",
          light: "#481055",
        },
        text: {
          DEFAULT: "#FFFFFF",
          dim: "#BEB4CF",
          dimmer: "#8E82A8",
          faint: "#5F5480",
        },
      },
      fontFamily: {
        display: ["var(--font-cairo)", "sans-serif"],
        body: ["var(--font-tajawal)", "sans-serif"],
        utility: ["var(--font-cairo)", "sans-serif"],
        num: ["var(--font-cairo)", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(233,0,82,0.18)",
        "glow-sm": "0 0 10px rgba(233,0,82,0.10)",
        "glow-lg": "0 0 40px rgba(233,0,82,0.24), 0 0 80px rgba(233,0,82,0.10)",
        "pulse-green": "0 0 20px rgba(0,255,135,0.25)",
        deep: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
        elevated: "0 4px 20px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.18)",
        card: "0 2px 8px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.14)",
        "card-soft": "0 1px 6px rgba(0,0,0,0.18), 0 4px 16px rgba(55,0,60,0.12)",
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