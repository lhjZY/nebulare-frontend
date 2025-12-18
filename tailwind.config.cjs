/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    // 优先级颜色类
    "border-gray-300",
    "border-blue-500",
    "border-yellow-500",
    "border-red-500",
    "text-gray-400",
    "text-blue-500",
    "text-yellow-500",
    "text-red-500",
    "bg-gray-400",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-red-500",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f0f2f5",
        "surface-variant": "#e1e3e6",
        primary: {
          DEFAULT: "rgba(var(--color-primary), <alpha-value>)",
          foreground: "rgba(var(--color-primary-front), <alpha-value>)",
        },
        "on-primary": "#001d35",
        outline: "#747775",
        "on-surface": "#1f1f1f",
        background: "rgba(var(--color-main-background), <alpha-value>)",
        foreground: "rgba(var(--color-grey), <alpha-value>)",
        card: {
          DEFAULT: "rgba(var(--color-card-bg), <alpha-value>)",
          foreground: "rgba(var(--color-grey), <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgba(var(--color-main-background), <alpha-value>)",
          foreground: "rgba(var(--color-grey), <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgba(var(--color-gallery), <alpha-value>)",
          foreground: "rgba(var(--color-grey), <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgba(var(--color-gallery), <alpha-value>)",
          foreground: "rgba(var(--color-grey), 0.7)",
        },
        accent: {
          DEFAULT: "rgba(var(--color-primary), 0.1)",
          foreground: "rgba(var(--color-primary), 1)",
        },
        destructive: {
          DEFAULT: "rgba(var(--color-dark-red), <alpha-value>)",
          foreground: "rgba(var(--color-white), <alpha-value>)",
        },
        border: "rgba(var(--color-grey), 0.1)",
        input: "rgba(var(--color-grey), 0.1)",
        ring: "rgba(var(--color-primary), 1)",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
      borderRadius: {
        xl: "1.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
