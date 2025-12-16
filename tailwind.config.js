/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
      },
      colors: {
        'background': 'var(--color-background)',
        'card-background': 'var(--color-card-background)',
        'component-background': 'var(--color-component-background)',
        'component-background-2': 'var(--color-component-background-2)',
        'border': 'var(--color-border)',
        'white': 'var(--color-white)',
        'black': 'var(--color-black)',
        'primary':'var(--color-primary)',
        'text': 'var(--color-text)',
        'text-2': 'var(--color-text-2)',
      },
    },
  },
  plugins: [],
}; 
