/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors:{
        'celeste': '#3A6EA5',
        'azul': '#1F3C88',
        'amarrillo': '#F2C200',
        'negro': '#2E2E2E',
        'verde': '#2E7D32',
        'mostaza': '#F9A825',
        'rojo': '#C62828'
      }
    },
  },
  plugins: [],
};
