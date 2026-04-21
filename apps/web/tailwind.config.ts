import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          DEFAULT: '#3B1FA8',
          dark: '#270F7A',
          mid: '#5535C4',
          light: '#7B5FE0',
          pale: '#EDE8FF',
          ghost: '#F7F5FF',
        },
        cobalt: {
          DEFAULT: '#0A2799',
          mid: '#1A3FCC',
          light: '#3D63F5',
          pale: '#E4EAFF',
        },
        ink: {
          DEFAULT: '#1A0A3E',
          2: '#3D2C6E',
          3: '#7B6FA0',
          4: '#A99EC4',
        },
        surface: {
          DEFAULT: '#FAFAF8',
          2: '#F4F3EF',
          3: '#EEEDEA',
        },
        border: {
          DEFAULT: '#E2DFF5',
          2: '#CCC8EA',
          subtle: '#F0EEF8',
        },
        teal: {
          DEFAULT: '#00B894',
          light: '#E6FAF5',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#FFF8E7',
        },
        red: {
          DEFAULT: '#E8334A',
          light: '#FFF0F2',
        },
        // Editorial redesign tokens
        redesign: {
          white: '#FFFFFF',
          'off-white': '#FCFCFB',
          surface: '#F5F4F1',
          'surface-2': '#EFEDE8',
          border: '#ECEAE4',
          'border-strong': '#D8D5CE',
          'text-primary': '#1A1815',
          'text-secondary': '#5C5955',
          'text-tertiary': '#A8A59E',
          accent: '#3B1FA8',
          'accent-hover': '#2D178A',
          'accent-light': '#F0ECFA',
          'accent-subtle': '#F8F6FE',
          success: '#2D7A4E',
          'success-bg': '#F3F7F4',
          warning: '#A66A12',
          'warning-bg': '#FAF7F1',
          danger: '#B33636',
          'danger-bg': '#FAF3F3',
          info: '#2E5AA8',
          'info-bg': '#F2F5FA',
          'gold-new': '#B8902A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'DM Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: '3px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(59,31,168,0.04)',
        sm: '0 2px 8px rgba(59,31,168,0.06)',
        md: '0 4px 16px rgba(59,31,168,0.08)',
        lg: '0 8px 32px rgba(59,31,168,0.12)',
        xl: '0 16px 48px rgba(59,31,168,0.16)',
        violet: '0 4px 20px rgba(59,31,168,0.28)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'card': '0 1px 3px rgba(59,31,168,0.04), 0 4px 12px rgba(59,31,168,0.03)',
        'card-hover': '0 4px 12px rgba(59,31,168,0.06), 0 12px 28px rgba(59,31,168,0.08)',
      },
      maxWidth: {
        container: '1200px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'counter': 'counter 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-violet': 'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
        'gradient-bar': 'linear-gradient(90deg, #270F7A, #3B1FA8, #5535C4, #1A3FCC, #3D63F5)',
        'gradient-card': 'linear-gradient(135deg, rgba(59,31,168,0.02) 0%, rgba(61,99,245,0.02) 100%)',
        'gradient-shine': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
