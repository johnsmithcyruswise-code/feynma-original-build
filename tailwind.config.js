/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050507',
        card: '#0C0C10',
        soft: '#E4E4E7',
        muted: '#71717A',
        accent: {
          idle: '#6366F1',
          active: '#34D399',
          warning: '#F59E0B',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        orbBreathe: {
          '0%, 100%': { transform: 'scale(1)', borderRadius: '50%' },
          '50%': { transform: 'scale(1.04)', borderRadius: '48% 52% 51% 49% / 51% 49% 52% 48%' },
        },
        orbLive: {
          '0%, 100%': { transform: 'scale(1)', borderRadius: '50%' },
          '50%': { transform: 'scale(1.05)', borderRadius: '49% 51% 52% 48% / 50% 52% 48% 50%' },
        },
        waveRipple: {
          '0%': { transform: 'scale(0.9)', opacity: '0.5' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        corePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.4)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'orb-breathe': 'orbBreathe 6s ease-in-out infinite',
        'orb-live': 'orbLive 2s ease-in-out infinite',
        'wave-ripple': 'waveRipple 2.5s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
        'core-pulse': 'corePulse 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
};
