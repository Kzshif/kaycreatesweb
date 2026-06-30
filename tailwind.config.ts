import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Futuristic dark palette
        night: "#05070f",
        panel: "#0a0f1e",
        cyan: {
          DEFAULT: "#3ef0e0",
          soft: "#7af6ea",
        },
        iris: {
          DEFAULT: "#8b7bff",
          soft: "#b3a8ff",
        },
        amber: {
          accent: "#ffb347",
        },
        // Legacy tokens kept so existing utilities still resolve
        ink: "#05070f",
        cream: "#eef2ff",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(62,240,224,0.18), 0 18px 60px -24px rgba(62,240,224,0.45)",
        "glow-iris": "0 0 0 1px rgba(139,123,255,0.22), 0 18px 60px -24px rgba(139,123,255,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
