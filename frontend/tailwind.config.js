/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors with purple gradient support
        background: '#000000',
        'background-gradient': {
          'from': '#6c3baa',
          'to': '#000000',
        },
        surface: '#111111',
        'surface-2': '#1a1a1a',
        foreground: '#ffffff',
        'foreground-muted': '#a3a3a3',
        'foreground-subtle': '#525252',
        primary: {
          DEFAULT: '#ffffff',
          hover: '#f5f5f5',
        },
        accent: '#6c3baa',
        'accent-dark': '#4f2a80',
        border: '#262626',
        input: '#1a1a1a',
        success: '#22c55e',
        error: '#ef4444',
        purple: {
          DEFAULT: '#6c3baa',
          light: '#8b5cf6',
          dark: '#4f2a80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'hero-sm': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
      borderRadius: {
        'DEFAULT': '12px',
        'lg': '16px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 255, 255, 0.1)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}