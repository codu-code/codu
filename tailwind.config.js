module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#040404",
        twitter: "var(--twitter-clr)",
        github: "var(--github-clr)",
        discord: "var(--discord-clr)",
        youtube: "var(--youtube-clr)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
  darkMode: ["class"],
};
