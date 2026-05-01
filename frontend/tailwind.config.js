/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#05050f',
        bg2: '#0a0a1a',
        bg3: '#0f0f22',
        card: '#0d0d1f',
        border: '#1a1a35',
        border2: '#252545',
        purple: '#7c3aed',
        purple2: '#9d5ff5',
        teal: '#0d9488',
        green: '#10b981',
        red: '#ef4444',
        amber: '#f59e0b',
        blue: '#3b82f6',
        orange: '#f97316',
        text: '#f0f0ff',
        text2: '#8888aa',
        text3: '#44445a',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Syne', 'sans-serif'],
      },
      keyframes: {
        fadeup: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideUp: {
          '0%': { transform: 'translateY(60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        growWidth: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--target-width)' },
        },
      },
      animation: {
        fadeup: 'fadeup 0.5s ease-out forwards',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        slideUp: 'slideUp 0.4s ease-out forwards',
        growWidth: 'growWidth 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
