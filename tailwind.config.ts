import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f4",
          100: "#f9eee3",
          200: "#f2dac6",
          300: "#e8bfa0",
          400: "#dc9c74",
          500: "#d07e51", // Nâu sữa caramel đặc trưng
          600: "#c06642",
          700: "#a04f36",
          800: "#824031",
          900: "#6a372c",
          950: "#3a1b15",
        },
        tea: {
          matcha: "#4d7c0f",
          oolong: "#78350f",
          thai: "#c2410c",
          black: "#1e1b18",
        },
        surface: {
          light: "#faf9f6",
          card: "#ffffff",
          subtle: "#f3f1ec",
          dark: "#141210",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 2px 8px -2px rgba(0, 0, 0, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)",
        floating: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
