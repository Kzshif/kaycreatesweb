import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light (app) context — Cosmic Nova, Paper side
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
        // Dark (marketing) context — Cosmic Nova, Deep Space side
        space: {
          DEFAULT: "#08070f",
          raised: "#100e1c",
        },
        nova: {
          DEFAULT: "#ffb454",
          deep: "#f59f00",
        },
        nebula: "#f06595",
        stellar: "#3bc9db",
        starlight: "#f4f2ff",
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
