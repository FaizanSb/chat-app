/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // 👈 ye line important hai — poora src cover karti hai
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}