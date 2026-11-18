/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F9F5F1',
        primary: '#FF6B47',
        'primary-light': '#FFF0EC',
        ink: '#333333',
        muted: '#64829E',
        border: '#E5DED4',
      },
    },
  },
  plugins: [],
};
