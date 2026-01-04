/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cena: {
          bg: '#0F1014', // Background gelap (referensi gambar Home)
          card: '#1A1C24',
          primary: '#FF2965', // Warna aksen Pink/Merah (referensi tombol/corner)
          text: '#FFFFFF',
          subtext: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
}