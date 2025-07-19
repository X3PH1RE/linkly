/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'video-dark': '#1a1a1a',
        'video-bg': '#0f0f0f',
        'control-bg': 'rgba(255, 255, 255, 0.1)',
        'control-hover': 'rgba(255, 255, 255, 0.2)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(2.4)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
} 