/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        'cyber': {
          'dark': '#070712',
          'cyan': '#00FFFF',
          'magenta': '#FF2BD6',
          'lime': '#00FF9F',
        },
      },
    },
  },
  plugins: [],
}
