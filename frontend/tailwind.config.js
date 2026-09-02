/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F3EA",
        "seal-cream": "#EFE6D3",
        ink: "#1E2148",
        "ink-soft": "#33366B",
        turmeric: "#E8A33D",
        "turmeric-deep": "#B87A1F",
        terracotta: "#B23A2E",
        sage: "#4C7A5E",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "sans-serif"],
        serif: ["Zilla Slab", "serif"],
      }
    },
  },
  plugins: [],
}
