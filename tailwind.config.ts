import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "rgb(var(--bg-rgb) / <alpha-value>)",
          deep: "rgb(var(--bg-deep-rgb) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated-rgb) / <alpha-value>)",
          raised2: "rgb(var(--surface-raised2-rgb) / <alpha-value>)",
        },
        purple: {
          DEFAULT: "rgb(var(--purple-rgb) / <alpha-value>)",
          bright: "#2E7BFF",
          dim: "rgb(var(--purple-dim-rgb) / <alpha-value>)",
        },
        live: "#FF3D2E",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          bright: "rgb(var(--accent-bright-rgb) / <alpha-value>)",
          dim: "rgb(var(--accent-dim-rgb) / <alpha-value>)",
          faint: "rgb(var(--accent-faint-rgb) / <alpha-value>)",
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
        "line-accent": "rgb(var(--line-accent-rgb) / <alpha-value>)",
        "line-strong": "rgba(255,255,255,0.14)",
        navy: {
          DEFAULT: "rgb(var(--navy-rgb) / <alpha-value>)",
          light: "rgb(var(--navy-light-rgb) / <alpha-value>)",
        },
        text: {
          DEFAULT: "#FFFFFF",
          dim: "#C7D2E3",
          dimmer: "#94A3B8",
          faint: "#64748B",
        },
      },
      fontFamily: {
        display: ["var(--font-cairo)", "sans-serif"],
        body: ["var(--font-almarai)", "sans-serif"],
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
        glow: "0 0 20px rgba(255,212,0,0.20)",
        "glow-sm": "0 0 10px rgba(255,212,0,0.14)",
        "glow-lg": "0 0 40px rgba(255,212,0,0.28), 0 0 80px rgba(255,212,0,0.10)",
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