/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#0B0F19",
        "seal-cream": "#151B2B",
        ink: "#F8FAFC",
        "ink-soft": "#94A3B8",
        turmeric: "#3B82F6",
        "turmeric-deep": "#8B5CF6",
        terracotta: "#F43F5E",
        sage: "#10B981",
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
