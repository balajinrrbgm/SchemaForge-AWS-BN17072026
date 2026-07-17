import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // SchemaForge brand — code editor / developer tool aesthetic
        brand: {
          violet: '#7c3aed',
          cyan: '#06b6d4',
          dark: '#0a0a0f',
          surface: '#111118',
          border: 'rgba(255,255,255,0.08)',
        },
        // Database brand colors
        aurora: {
          DEFAULT: '#ff9900',   // AWS orange — Aurora PostgreSQL
          dsql: '#a855f7',      // Purple — Aurora DSQL (distributed)
        },
        dynamo: {
          DEFAULT: '#3b82f6',   // Blue — DynamoDB
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
