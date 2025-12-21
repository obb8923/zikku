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
        'background': '#F7F7F4',
        'card-background': '#F2F1EE',
        'component-background': '#E6E5E1',
        'component-background-2': '#D3D2CB',
        'border': '#EDECE9',
        'white': '#fefefe',
        'black': '#191919',
        'primary': '#FF3900',
        'text': '#26251D',
        'text-2': '#75746C',
        'text-digit':'#FF8C00',
      },
    },
  },
  plugins: [],
}; 
