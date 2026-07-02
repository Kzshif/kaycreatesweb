import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1f24",
        slate: {
          950: "#0b1418",
        },
        teal: {
          DEFAULT: "#0d6e6e",
          deep: "#0a4f4f",
          light: "#7fd1c7",
        },
        amber: {
          accent: "#e0913a",
        },
        cream: "#f6f3ec",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
