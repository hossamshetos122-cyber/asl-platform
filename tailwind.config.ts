import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0E14",
          raised: "#12161F",
          raised2: "#171C27",
        },
        line: "rgba(255,255,255,0.08)",
        "line-gold": "rgba(201,169,97,0.35)",
        gold: {
          DEFAULT: "#C9A961",
          bright: "#E0C275",
          dim: "#A08840",
        },
        live: "#E14B3E",
        success: "#22C55E",
        text: {
          DEFAULT: "#FFFFFF",
          dim: "#9BA0AC",
          dimmer: "#5C6170",
          faint: "#3A3F4B",
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
      },
      boxShadow: {
        glow: "0 0 20px rgba(201,169,97,0.15)",
        "glow-sm": "0 0 10px rgba(201,169,97,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
