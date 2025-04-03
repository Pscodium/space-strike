/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'space-blue': {
            '50': '#f0f8ff',
            '100': '#e0f0fe',
            '200': '#bae0fd',
            '300': '#7cc6fb',
            '400': '#39a5f7',
            '500': '#1088eb',
            '600': '#0771d9',
            '700': '#0b5cb0',
            '800': '#104b8d',
            '900': '#124076',
          },
          'space-dark': {
            '800': '#1a1a2e',
            '900': '#0f0f1e',
          },
        },
        animation: {
          'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'float': 'float 3s ease-in-out infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          }
        },
      },
    },
    plugins: [],
  };