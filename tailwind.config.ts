import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
