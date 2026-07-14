import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light (app) context — Cosmic Nova, Paper side
        ink: "#1a2142",
        paper: "#f2f0ec",
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
        // Dark (marketing) context — Cosmic Nova, Deep Space side
        space: {
          DEFAULT: "#0b0812",
          raised: "#171126",
        },
        nova: {
          DEFAULT: "#a855f7",
          deep: "#7c3aed",
        },
        nebula: "#6366f1",
        stellar: "#22d3ee",
        starlight: "#f5f3ff",
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
