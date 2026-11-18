/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F9F5F1',
        surface: '#FFFFFF',
        primary: '#FF6B47',
        'primary-hover': '#E85A37',
        'primary-light': '#FFF0EC',
        ink: '#333333',
        muted: '#5E6A77',
        'slate-blue': '#64829E',
        border: '#E5DED4',
      },
    },
  },
  plugins: [],
};
