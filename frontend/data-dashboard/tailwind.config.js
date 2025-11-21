/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        utdOrange: "#e87500", // UTD official orange
        utdGreen: "#154734",  // UTD official green
      },
      height: {
        chart: "300px", // Custom height for charts
      },
    },
  },
  plugins: [],
};