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
        stream: {
          twitch: '#9146FF',
          kick: '#53FC18',
          youtube: '#FF0000',
          tiktok: '#FE2C55',
          streamlabs: '#31C3A2',
          streamelements: '#2374E1',
          botrix: '#784FFE',
          card: '#18181b',
          bg: '#09090b',
          border: '#27272a',
          hover: '#27272a'
        }
      }
    },
  },
  plugins: [],
}
