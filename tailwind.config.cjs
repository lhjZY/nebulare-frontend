/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f0f2f5",
        "surface-variant": "#e1e3e6",
        primary: "#c2e7ff",
        "on-primary": "#001d35",
        outline: "#747775",
        "on-surface": "#1f1f1f"
      },
      fontFamily: {
        sans: ["Roboto", "sans-serif"]
      },
      borderRadius: {
        xl: "1.5rem"
      }
    }
  },
  plugins: []
};
