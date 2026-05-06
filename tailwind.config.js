/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#0f0f10',
        'panel-border': '#262629',
      },
    },
  },
  plugins: [],
};
