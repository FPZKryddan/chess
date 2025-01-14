/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        chess_mérida: ["MERIFONT"],
        cases: ["CASEFONT"]
      }
    },
    colors: {
      primary: {
        grey: "#EAEAEA",
        dark: "#4F4F4F",
      },
      secondary: {
        redish: "#845961",
        brownish: "#A87767",
      },
      accent: {
        green: "#8b9a71",
        blue: "#3A8DFF",
      },
      neutral: {
        black: "#000000",
        white: "#FFFFFF",
      },
      text: {
        white: "#F7F6F6",
      },
    },
  },
  plugins: [],
};
