/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5ff',
          100: '#dce4fd',
          200: '#bacbf9',
          300: '#8aacf4',
          400: '#5d86ec',
          500: '#3b65e1',
          600: '#2a4dc7',
          700: '#1e3aaa',
          800: '#1a3090',
          900: '#1a2744',
          950: '#0f1a2e',
        },
        marble: {
          light: '#f5f0eb',
          DEFAULT: '#e8ddd0',
          dark: '#c8b9a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
