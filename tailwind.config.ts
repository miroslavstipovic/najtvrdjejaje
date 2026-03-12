import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bordo/crvena iz logotipa - glavna boja
        primary: {
          25: '#fef7f7',
          50: '#fceaea',
          100: '#f5c4c4',
          200: '#e89a9a',
          300: '#d66b6b',
          400: '#c44545',
          500: '#a33a3a',
          600: '#8B2D2D',
          700: '#7a2626',
          800: '#6b2222',
          900: '#4a1717',
        },
        // Zlatna iz logotipa - sekundarna boja
        gold: {
          50: '#faf6eb',
          100: '#f3ebce',
          200: '#e8d9a8',
          300: '#dcc88a',
          400: '#d4b86a',
          500: '#c9a962',
          600: '#b89a52',
          700: '#9a7f42',
          800: '#7c6635',
          900: '#5e4d28',
        },
        // Tamno sivo-zelena iz pozadine logotipa
        slate: {
          750: '#3D4A47',
          850: '#2D3835',
        },
        // Krem tonovi za pozadinu
        cream: {
          50: '#FDFCFA',
          100: '#FAF8F3',
          200: '#F5F0E6',
          300: '#EDE5D8',
          400: '#E3D9C8',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'xl': '0 12px 32px rgba(0, 0, 0, 0.16)',
        'hover': '0 12px 32px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
export default config
