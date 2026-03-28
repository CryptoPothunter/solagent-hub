/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0a0b0f', secondary: '#12131a', card: '#181924', 'card-hover': '#1e2030' },
        border: '#2a2d3e',
        accent: { DEFAULT: '#00f0ff', dim: '#00a8b3', glow: 'rgba(0,240,255,0.15)' },
        purple: { DEFAULT: '#8b5cf6' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
