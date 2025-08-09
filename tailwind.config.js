/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Outfit', 'Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        // Dark AI Startup Theme - Deep Navy Background
        background: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // Purple to Pink Gradient Primary
        primary: {
          50: '#faf7ff',
          100: '#f4edff',
          200: '#e9deff',
          300: '#d4c2ff',
          400: '#b794ff',
          500: '#9c5cff',
          600: '#8b3aff',
          700: '#7c28ed',
          800: '#6b21c7',
          900: '#581ba3',
          950: '#390a6f'
        },
        // Secondary Purple Tones
        secondary: {
          50: '#fdfcff',
          100: '#fbf8ff',
          200: '#f5f0ff',
          300: '#e6d9ff',
          400: '#cfb8ff',
          500: '#b794ff',
          600: '#9c5cff',
          700: '#8b3aff',
          800: '#7c28ed',
          900: '#6b21c7',
          950: '#481374'
        },
        // Pink/Magenta Accent
        accent: {
          50: '#fef7ff',
          100: '#fceeff',
          200: '#f8dcff',
          300: '#f1c0ff',
          400: '#e696ff',
          500: '#d665ff',
          600: '#c23cff',
          700: '#a61deb',
          800: '#8a18c4',
          900: '#72179f',
          950: '#4e0370'
        },
        // Danger/Error Red
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        // Success/Green (keeping minimal)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(156, 92, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(156, 92, 255, 0.6)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(156, 92, 255, 0.3)',
        'glow-pink': '0 0 20px rgba(214, 101, 255, 0.3)',
        'glow-strong': '0 0 40px rgba(156, 92, 255, 0.4)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}