/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        carvao: { 950: '#0b0b0c', 900: '#121214', 800: '#1b1b1f', 700: '#26262c', 600: '#34343c' },
        severo: { yellow: '#ffc928', 'yellow-dark': '#e6ad00', red: '#e8322b', 'red-dark': '#b91f19' },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(12px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out',
        'slide-in-right': 'slide-in-right .25s ease-out',
        'pop-in': 'pop-in .25s ease-out',
      },
    },
  },
  plugins: [],
};
