/** @type {import('tailwindcss').Config} */

/** Semantic tokens resolve to CSS variables so light and dark share one class name. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1200px' },
    },

    /* A tighter, deliberately curated type scale. Everything is a notch smaller and
       more closely leaded than Tailwind's default. */
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      xs: ['0.75rem', { lineHeight: '1.1rem' }],
      sm: ['0.8125rem', { lineHeight: '1.3rem' }],
      base: ['0.875rem', { lineHeight: '1.5rem' }],
      md: ['0.9375rem', { lineHeight: '1.6rem' }],
      lg: ['1.0625rem', { lineHeight: '1.6rem', letterSpacing: '-0.01em' }],
      xl: ['1.1875rem', { lineHeight: '1.65rem', letterSpacing: '-0.011em' }],
      '2xl': ['1.4375rem', { lineHeight: '1.85rem', letterSpacing: '-0.015em' }],
      '3xl': ['1.75rem', { lineHeight: '2.15rem', letterSpacing: '-0.019em' }],
      '4xl': ['2.125rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em' }],
      '5xl': ['2.625rem', { lineHeight: '2.95rem', letterSpacing: '-0.025em' }],
      '6xl': ['3.25rem', { lineHeight: '3.5rem', letterSpacing: '-0.028em' }],
    },

    extend: {
      colors: {
        /* ---- semantic, theme-aware ---- */
        bg: token('bg'),
        surface: token('surface'),
        elevated: token('elevated'),
        subtle: token('subtle'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('fg'),
        muted: token('muted'),
        faint: token('faint'),
        brand: {
          DEFAULT: token('brand'),
          hover: token('brand-hover'),
          soft: token('brand-soft'),
          border: token('brand-border'),
          fg: token('brand-fg'),
        },
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
          border: token('accent-border'),
          fg: token('accent-fg'),
        },
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
          border: token('danger-border'),
        },

        /* ---- fixed scales, for gradients and always-dark panels ---- */
        leaf: {
          50: '#ECF8F1',
          100: '#D3EFE0',
          200: '#A9DFC3',
          300: '#74C9A0',
          400: '#43AE7C',
          500: '#22935F',
          600: '#16794C',
          700: '#13603E',
          800: '#134D34',
          900: '#11402C',
          950: '#062317',
        },
        ink: {
          50: '#F3F6F4',
          100: '#E3EAE5',
          200: '#C7D5CB',
          300: '#9CB2A3',
          400: '#6E8878',
          500: '#4F6A59',
          600: '#3C5345',
          700: '#314338',
          800: '#22312a',
          900: '#16211C',
          950: '#0B120E',
        },
        gold: {
          100: '#FBEFC8',
          200: '#F7DE8D',
          300: '#F2C752',
          400: '#EDB02B',
          500: '#D99113',
          600: '#B96D0E',
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
      },

      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.05), 0 1px 3px rgb(var(--shadow) / 0.04)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.04), 0 12px 28px -10px rgb(var(--shadow) / 0.16)',
        panel: '0 24px 60px -24px rgb(var(--shadow) / 0.28)',
      },

      borderRadius: { '4xl': '1.75rem' },

      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.16,1,.3,1) both',
        'fade-in': 'fade-in .35s ease both',
        'scale-in': 'scale-in .25s cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  plugins: [],
};
