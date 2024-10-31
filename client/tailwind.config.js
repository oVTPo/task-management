/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0065FA',  // Màu chính
          50: '#E0F2FF',       // Màu sắc độ 50 (nhạt nhất)
          100: '#B3E0FF',      // Màu sắc độ 100
          200: '#80C9FF',      // Màu sắc độ 200
          300: '#4DA8FF',      // Màu sắc độ 300
          400: '#1A8AFF',      // Màu sắc độ 400
          500: '#0065FA',      // Màu sắc độ 500
          600: '#0055D6',      // Màu sắc độ 600
          700: '#0041B3',      // Màu sắc độ 700
          800: '#002D8A',      // Màu sắc độ 800
          900: '#001A66',      // Màu sắc độ 900 (tối nhất)
        },
        excel: '#1e6e42',
      },
      height: {
        '112': '28rem', // Chiều cao giữa 96 và 128
      },
    },
  },
  plugins: [],
}
