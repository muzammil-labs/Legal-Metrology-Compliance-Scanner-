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
        "ink-soft": "#475569", 
        turmeric: "#E8A33D",
        "turmeric-deep": "#115E59",
        terracotta: "#B23A2E",
        sage: "#4C7A5E",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    }
  }
};
