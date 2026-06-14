/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: {
            dark: '#0A0E1A',
            light: '#F8FAFC'
          },
          panel: {
            dark: '#111827',
            light: '#FFFFFF'
          },
          border: {
            dark: '#1F2937',
            light: '#E2E8F0'
          },
          green: '#10B981',
          blue: '#0EA5E9',
          orange: '#F59E0B',
          red: '#EF4444',
          slate: {
            800: '#1E293B',
            900: '#0F172A'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Courier Prime', 'Courier', 'monospace']
      }
    },
  },
  plugins: [],
}
