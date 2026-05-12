import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0F1115',
          50:  '#1a1d24',
          100: '#161920',
          200: '#12151b',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.10)',
        },
        gold: {
          DEFAULT: '#C8A96B',
          light: '#DEC08A',
          dark:  '#A8894B',
          muted: 'rgba(200,169,107,0.15)',
        },
        ink: {
          DEFAULT: '#F5F7FA',
          secondary: '#AAB2C0',
          muted: '#6B7585',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto)', 'system-ui', 'sans-serif'],
        jp:   ['var(--font-noto)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover': '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        gold: '0 0 32px rgba(200,169,107,0.20)',
        'gold-sm': '0 0 16px rgba(200,169,107,0.15)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
    }
  },
  plugins: []
};

export default config;
