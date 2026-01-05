/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'edienai': {
          'amarelo': '#F5A623',
          'amarelo-escuro': '#E6951A',
          'vermelho': '#8B1538',
          'vermelho-escuro': '#6B102B',
          'fundo': '#1a1a2e',
          'fundo-claro': '#252540',
          'fundo-card': '#0d0d1a',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
