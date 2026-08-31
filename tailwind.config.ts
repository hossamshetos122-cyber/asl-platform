import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0F1E",
          deep: "#050810",
        },
        surface: {
          DEFAULT: "#10192E",
          elevated: "#1A2642",
          raised2: "#253352",
        },
        purple: {
          DEFAULT: "#123B6B",
          bright: "#2E7BFF",
          dim: "#0D2B4F",
        },
        live: "#FF3D2E",
        accent: {
          DEFAULT: "#F5C518",
          bright: "#FFE066",
          dim: "#D0A100",
          faint: "rgba(245,197,24,0.08)",
        },
        success: {
          DEFAULT: "#00D68F",
          bright: "#4BF0B3",
        },
        emerald: {
          DEFAULT: "#00D68F",
          400: "#10E0A6",
          500: "#00D68F",
        },
        cyan: "#2ED6F5",
        line: "rgba(255,255,255,0.08)",
        "line-accent": "rgba(245,197,24,0.40)",
        "line-strong": "rgba(255,255,255,0.14)",
        navy: {
          DEFAULT: "#103E72",
          light: "#1B5AA6",
        },
        text: {
          DEFAULT: "#FFFFFF",
          dim: "#B9C4DC",
          dimmer: "#8794B2",
          faint: "#5B6883",
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
        glow: "0 0 20px rgba(245,197,24,0.16)",
        "glow-sm": "0 0 10px rgba(245,197,24,0.10)",
        "glow-lg": "0 0 40px rgba(245,197,24,0.22), 0 0 80px rgba(245,197,24,0.08)",
        "pulse-green": "0 0 20px rgba(0,214,143,0.25)",
        deep: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
        elevated: "0 4px 20px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.18)",
        card: "0 2px 8px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.14)",
        "card-soft": "0 1px 6px rgba(0,0,0,0.18), 0 4px 16px rgba(16,25,46,0.5)",
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