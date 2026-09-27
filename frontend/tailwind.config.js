/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 950: '#1e1b4b' } }, boxShadow: { soft: '0 12px 35px rgba(15,23,42,.08)' } } },
  plugins: [],
};
