/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tz: {
          bg: '#0A0A0F',
          card: '#12121A',
          hover: '#1A1A25',
          active: '#1E1E2A',
          border: '#1F1F2E',
          'border-hover': '#2A2A3D',
          text: '#F0F0F5',
          muted: '#6B6B80',
          dim: '#44445A',
          accent: '#00E5CC',
          'accent-dim': 'rgba(0,229,204,0.12)',
          'accent-glow': 'rgba(0,229,204,0.25)',
          danger: '#FF4D6A',
          'danger-dim': 'rgba(255,77,106,0.12)',
          warning: '#FFB547',
          'warning-dim': 'rgba(255,181,71,0.12)',
          success: '#00E5CC',
          'success-dim': 'rgba(0,229,204,0.12)',
        },
        // Legacy compat
        'fleet-tracker': {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae6ff',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00E5CC',
          600: '#00C4B0',
          700: '#009E8F',
          800: '#007A6E',
          900: '#005A52',
          950: '#003D37',
        },
        success: '#00E5CC',
        warning: '#FFB547',
        error: '#FF4D6A',
        info: '#00E5CC',
      },
      fontFamily: {
        sans: ['Syne', 'system-ui', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in': 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'glow': 'glow 2s ease-in-out infinite',
        'dot-pulse': 'dotPulse 2s ease-in-out infinite',
        'pulse-dot': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out',
        'bar-grow': 'barGrow 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,229,204,0.25)' },
          '50%': { boxShadow: '0 0 20px rgba(0,229,204,0.25)' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        barGrow: {
          from: { width: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '72px',
      },
      borderRadius: {
        tz: '12px',
        'tz-sm': '8px',
        'tz-lg': '16px',
      },
      boxShadow: {
        tz: '0 4px 24px rgba(0,0,0,0.4)',
        'tz-lg': '0 8px 48px rgba(0,0,0,0.5)',
        'tz-glow': '0 0 24px rgba(0,229,204,0.15)',
        'tz-glow-strong': '0 0 32px rgba(0,229,204,0.3)',
      },
    },
  },
  plugins: [],
}
