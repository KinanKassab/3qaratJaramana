import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8ed', 100: '#f9edcc', 200: '#f3d98a', 300: '#e9be58',
          400: '#dfa332', 500: '#C4A35A', 600: '#a8843a', 700: '#8b6a2e',
          800: '#6f5224', 900: '#59401c', 950: '#32230d',
        },
        secondary: {
          50: '#f0f5fb', 100: '#dce9f5', 200: '#b8d3ea', 300: '#87b3d9',
          400: '#5490c4', 500: '#3573b0', 600: '#275b94', 700: '#214979',
          800: '#1B3A5C', 900: '#182f4c', 950: '#0f1e32',
        },
        dark: {
          50: '#f8f9fa', 100: '#f1f3f5', 200: '#e9ecef', 300: '#dee2e6',
          400: '#ced4da', 500: '#adb5bd', 600: '#6c757d', 700: '#495057',
          800: '#343a40', 900: '#212529', 950: '#0d0f10',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
