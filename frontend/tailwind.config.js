/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        raspberry: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0da',
          300: '#f4a9bc',
          400: '#ed7697',
          500: '#e04874',
          600: '#c9255b',
          700: '#a91a4a',
          800: '#8d1941',
          900: '#78193c',
        },
        midnight: {
          50: '#f4f6fb',
          100: '#e8ecf6',
          200: '#ccd6eb',
          300: '#a0b4d9',
          400: '#6d8cc3',
          500: '#4a6cac',
          600: '#385490',
          700: '#2e4475',
          800: '#293b62',
          900: '#0f172a',
          950: '#080c17',
        },
      },
      fontFamily: {
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        body: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(224, 72, 116, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(224, 72, 116, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

