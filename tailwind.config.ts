import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light (app) context — Voltage Editorial, Paper side
        ink: "#12141d",
        paper: "#f8f7f3",
        primary: {
          DEFAULT: "#3b5bdb",
          deep: "#2b44ad",
          light: "#93a5f0",
        },
        accent: {
          DEFAULT: "#e8590c",
          soft: "#f7b287",
        },
        mint: "#0ca678",
        // Dark (marketing) context — Voltage Editorial, Night side
        night: {
          DEFAULT: "#090b12",
          raised: "#0e111c",
        },
        volt: {
          DEFAULT: "#4c6ef5",
          bright: "#5c7cfa",
        },
        live: "#22d3ee",
        filament: "#ff7847",
        silver: "#eef0f6",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
