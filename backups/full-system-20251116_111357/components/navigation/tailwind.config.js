/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nodo360 Brand Colors
        'nodo-black': '#000000',
        'nodo-dark': '#0d1117',
        'nodo-border': '#30363d',
        'nodo-red': {
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
          light: '#ef4444',
        },
        // Grises personalizados
        'nodo-gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'nodo': '1280px',
      },
      boxShadow: {
        'nodo-accent': '0 8px 16px rgba(220, 38, 38, 0.3)',
        'nodo-card': '0 20px 40px rgba(220, 38, 38, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-nodo': 'linear-gradient(180deg, #000000 0%, #0d1117 100%)',
      },
    },
  },
  plugins: [],
}
