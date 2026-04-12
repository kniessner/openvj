/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#1e2433',
          850: '#18202f',
          950: '#0d1117',
        },
      },
    },
  },
  plugins: [],
}
