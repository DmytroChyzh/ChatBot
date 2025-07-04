/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx,css}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx,css}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx,css}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx,css}',
    './src/types/**/*.{js,ts,jsx,tsx,mdx,css}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx,css}',
    './public/**/*.html',
    './node_modules/lucide-react/**/*.js',
    './src/app/globals.css',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        '2xl': '0 8px 32px 0 rgba(60, 60, 70, 0.18)',
        'xl': '0 4px 16px 0 rgba(60, 60, 70, 0.12)',
        'lg': '0 2px 8px 0 rgba(60, 60, 70, 0.10)',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-background', 'text-foreground', 'bg-accent', 'text-accent-foreground',
    'bg-primary', 'text-primary-foreground', 'bg-secondary', 'text-secondary-foreground',
    'bg-muted', 'text-muted-foreground', 'bg-card', 'text-card-foreground',
    'bg-popover', 'text-popover-foreground', 'border', 'border-input', 'border-ring',
    'ring', 'ring-2', 'rounded-3xl', 'shadow-2xl',
    'bg-white', 'text-white', 'bg-[#23232B]', 'dark:bg-[#23232B]',
    'bg-gradient-to-br', 'from-[#8B5CF6]', 'to-[#6030FE]',
    'bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-900/40', 'dark:text-yellow-200',
    'bg-green-100', 'text-green-800', 'dark:bg-green-900/40', 'dark:text-green-200',
    'bg-gray-200', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700',
    'bg-white/90', 'dark:bg-[#23232B]/90', 'bg-white/70', 'dark:bg-[#23232B]/70',
    'text-gray-900', 'dark:text-white', 'text-gray-700', 'dark:text-gray-200',
    'text-[#8B5CF6]', 'text-[#6030FE]',
  ],
}; 