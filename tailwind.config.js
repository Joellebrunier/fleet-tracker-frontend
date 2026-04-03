/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ft: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          hover: '#F9FAFB',
          active: '#EFF6FF',
          border: '#E5E7EB',
          'border-hover': '#D1D5DB',
          text: '#1F2937',
          muted: '#6B7280',
          dim: '#9CA3AF',
          primary: '#4361EE',
          'primary-hover': '#3B53D5',
          success: '#22C55E',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#4361EE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
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
          '0%, 100%': { boxShadow: '0 0 8px rgba(67,97,238,0.15)' },
          '50%': { boxShadow: '0 0 20px rgba(67,97,238,0.25)' },
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
        ft: '12px',
        'ft-sm': '8px',
        'ft-lg': '16px',
      },
      boxShadow: {
        ft: '0 1px 3px rgba(0,0,0,0.1)',
        'ft-md': '0 4px 12px rgba(0,0,0,0.08)',
        'ft-lg': '0 10px 25px rgba(0,0,0,0.1)',
        'ft-glow': '0 0 24px rgba(67,97,238,0.15)',
        'ft-glow-strong': '0 0 32px rgba(67,97,238,0.25)',
      },
    },
  },
  plugins: [],
}
