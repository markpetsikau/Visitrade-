import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — dark premium tech
        base: "#0A0E14",
        surface: {
          DEFAULT: "#0F151E",
          raised: "#131A24",
          hover: "#18212E",
        },
        border: {
          DEFAULT: "#1E2836",
          strong: "#2A3646",
        },
        // Text
        ink: {
          DEFAULT: "#E7ECF3",
          muted: "#95A3B8",
          faint: "#5D6B7E",
        },
        // Brand accent — electric cyan (tech / data / confiance)
        brand: {
          DEFAULT: "#00D1B2",
          bright: "#22E4C6",
          dim: "#0A9E88",
          glow: "rgba(0,209,178,0.14)",
        },
        // Market signals
        bull: "#22C55E",
        bear: "#F04452",
        neutral: "#94A3B8",
        warn: "#F5A524",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,209,178,0.25), 0 8px 40px -12px rgba(0,209,178,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.7)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
