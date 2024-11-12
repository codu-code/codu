module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#040404",
        twitter: "#282828",
        github: "#f17f06",
      },
      backgroundImage: {
        discord: "linear-gradient(to bottom, #4b83fb, #734df8)",
        youtube: "linear-gradient(to top, #6d0202 22%, #c90000 61%)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
  darkMode: ["class"],
};
