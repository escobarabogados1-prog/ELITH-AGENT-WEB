import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f6",
          100: "#d3daE6",
          400: "#2c3e63",
          600: "#1a2440",
          700: "#131a30",
          900: "#0a0e1c",
        },
        gold: {
          300: "#e9d9a8",
          400: "#d9b96a",
          500: "#c9a24a",
          600: "#a8822f",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "Segoe UI", "Inter", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
