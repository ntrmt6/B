/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-neutal-200": "var(--primary-neutal-200)",
        "primary-primary-500": "var(--primary-primary-500)",
        "variable-collection-black": "var(--variable-collection-black)",
      },
      boxShadow: {
        "1dp-ambient": "var(--1dp-ambient)",
        "6dp-ambient": "var(--6dp-ambient)",
        "8dp-umbra": "var(--8dp-umbra)",
        "ambient-shadow": "var(--ambient-shadow)",
      },
    },
  },
  plugins: [],
};
