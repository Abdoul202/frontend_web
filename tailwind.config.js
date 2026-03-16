/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e6',
          200: '#bbe5ce',
          300: '#8dd0af',
          400: '#57b387',
          500: '#2e9466',
          600: '#1e7a52',
          700: '#196243',
          800: '#174f37',
          900: '#14412e',
          950: '#0a2419',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#070d1a',
        },
        danger: { 500: '#ef4444', 100: '#fee2e2' },
        warning: { 500: '#f59e0b', 100: '#fef3c7' },
        info: { 500: '#3b82f6', 100: '#dbeafe' },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 16px -2px rgb(0 0 0 / 0.12)',
        glow: '0 0 20px -4px rgb(46 148 102 / 0.4)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} // Force HMR

