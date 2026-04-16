/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Reduced font sizes for mobile-friendly viewing
        'xs': ['0.65rem', { lineHeight: '0.9rem' }],
        'sm': ['0.75rem', { lineHeight: '1rem' }],
        'base': ['0.875rem', { lineHeight: '1.25rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.5rem', { lineHeight: '2rem' }],
        '4xl': ['1.75rem', { lineHeight: '2.25rem' }],
        '5xl': ['2rem', { lineHeight: '2.5rem' }],
        '6xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '7xl': ['2.5rem', { lineHeight: '3rem' }],
        '8xl': ['3rem', { lineHeight: '3.5rem' }],
        '9xl': ['3.5rem', { lineHeight: '4rem' }],
      },
      colors: {
        // Theme Colors - Consistent across the app
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Navy Blue - Main theme color
        navy: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Custom theme colors
        theme: {
          // Primary blue for buttons, active states
          primary: '#4f46e5', // navy-600
          'primary-hover': '#4338ca', // navy-700
          'primary-light': '#e0e7ff', // navy-100
          
          // Sidebar colors
          'sidebar-bg': '#f3f4f6', // light purple/gray
          'sidebar-bg-light': '#f8fafc',
          'sidebar-bg-dark': '#e2e8f0',
          
          // Text colors
          'text-primary': '#1f2937', // gray-800
          'text-secondary': '#6b7280', // gray-500
          'text-muted': '#9ca3af', // gray-400
          
          // Background colors
          'bg-primary': '#ffffff',
          'bg-secondary': '#f9fafb', // gray-50
          'bg-card': '#ffffff',
          
          // Accent colors
          'accent-blue': '#3b82f6', // blue-500
          'accent-purple': '#8b5cf6', // purple-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
