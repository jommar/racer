/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        primary: '#e11d48', // Crimson/Racing Red
        secondary: '#1f2937',
        accent: '#fbbf24', // Trophy Gold
      }
    },
  },
  plugins: [],
}
