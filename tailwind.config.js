/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        forge: {
          ink: '#080B12',
          panel: '#111827',
          line: '#243044',
          mint: '#47D7AC',
          cyan: '#38BDF8',
          violet: '#A78BFA',
          amber: '#FBBF24',
          rose: '#FB7185',
        },
      },
      boxShadow: {
        glow: '0 24px 80px rgba(56, 189, 248, 0.18)',
        soft: '0 18px 60px rgba(5, 10, 20, 0.18)',
      },
    },
  },
  plugins: [
    ({ addVariant }) => {
      addVariant('light', '.light &');
    },
  ],
};
