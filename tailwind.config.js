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
        'background': '#121212',
        'component-background': '#373737',
        'border': '#4c4c4c',
        'white': '#fafafa',
        'black': '#0a0a0a',
        'primary': '#FF3900',
        'text': '#fafafa',
        'text-2': '#8d8d8d',
      },
    },
  },
  plugins: [],
}; 
