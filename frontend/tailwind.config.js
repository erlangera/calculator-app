/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-from': '#667eea',
        'brand-to': '#764ba2',
      },
      borderWidth: {
        '3': '3px',
      },
      textShadow: {
        'lg': '0 2px 4px rgba(0,0,0,0.3)',
      }
    },
  },
  plugins: [],
} 