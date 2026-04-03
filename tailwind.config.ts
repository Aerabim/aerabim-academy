import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          dark: '#040B11',
          blue: '#304057',
          gray: '#58758C',
          light: '#9DB1BF',
        },
        surface: {
          0: '#060D15',
          1: '#0B1520',
          2: '#111E2C',
          3: '#172636',
          4: '#1D2F42',
        },
        text: {
          primary: '#EAF0F4',
          secondary: '#8BA0B2',
          muted: '#4A6478',
        },
        accent: {
          cyan: '#4ECDC4',
          'cyan-dim': 'rgba(78,205,196,0.08)',
          amber: '#F0A500',
          rose: '#E8505B',
          emerald: '#2ECC71',
          violet: '#A06BD6',
        },
        border: {
          subtle: 'rgba(157,177,191,0.06)',
          hover: 'rgba(157,177,191,0.12)',
        },
      },
      fontFamily: {
        heading: ['var(--font-outfit)', ...defaultTheme.fontFamily.sans],
        sans: ['var(--font-jakarta)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        cardExpand: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        aurora: {
          '0%':   { backgroundPosition: '0% 0%' },
          '50%':  { backgroundPosition: '0% 60%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
      },
      animation: {
        fadeIn:      'fadeIn 0.45s cubic-bezier(0.4,0,0.2,1) forwards',
        pulseRing:   'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
        slideInRight:'slideInRight 0.18s cubic-bezier(0.4,0,0.2,1) forwards',
        slideInLeft: 'slideInLeft 0.18s cubic-bezier(0.4,0,0.2,1) forwards',
        cardExpand:  'cardExpand 0.2s cubic-bezier(0.4,0,0.2,1) forwards',
        aurora:      'aurora 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
