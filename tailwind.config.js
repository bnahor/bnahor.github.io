/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#090D0B',
        surface: '#111512',
        'surface-alt': '#171D19',
        'text-primary': '#F4F1E8',
        'text-muted': '#9AA39B',
        brand: {
          DEFAULT: '#79D6A5',
          50: '#E9FFF2',
          100: '#CEF7DE',
          200: '#A9EBC5',
          300: '#79D6A5',
          400: '#55BD87',
          500: '#349E67',
          600: '#247A4E',
          700: '#1D5E3F',
          800: '#184B34',
          900: '#123827',
        },
        accent: '#D8B45F',
        highlight: '#8CB7D8',
        line: 'rgba(244, 241, 232, 0.11)',
        stroke: 'rgba(244, 241, 232, 0.11)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'sans-serif'],
        display: ['"Sora"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(2.8rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        'container': '1120px',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 34px rgba(0, 0, 0, 0.28)',
        'glow': '0 0 32px rgba(121, 214, 165, 0.13)',
        'panel': '0 24px 80px rgba(0, 0, 0, 0.42)',
      },
      borderRadius: {
        '2xl': '0.5rem',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gentle': 'pulseGentle 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 30px rgba(0, 229, 255, 0.2)'
          },
        },
      },
    },
  },
  plugins: [],
}
