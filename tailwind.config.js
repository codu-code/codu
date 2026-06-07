/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Relaunch type system (loaded via next/font in app/layout.tsx).
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        black: "#040404",
        twitter: "#282828",
        github: "#f17f06",
        // Relaunch design tokens — driven by CSS vars (see styles/globals.css)
        // so they theme cleanly across dark/light. Use like bg-surface,
        // text-fg, text-accent, border-hairline, etc.
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        hairline: "rgb(var(--color-hairline) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        faint: "rgb(var(--color-faint) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        },
      },
      backgroundImage: {
        discord: "linear-gradient(to bottom, #4b83fb, #734df8)",
        youtube: "linear-gradient(to top, #6d0202 22%, #c90000 61%)",
        // Subtle dotted grid for editorial atmosphere.
        // Pair with an arbitrary size, e.g. bg-grid-dots bg-[length:22px_22px]
        "grid-dots":
          "radial-gradient(rgb(var(--color-hairline)) 1px, transparent 1px)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.15" },
          "50%": { opacity: "0.7" },
        },
        aurora: {
          "0%, 100%": {
            transform: "translate(-50%, 0) scale(1)",
            opacity: "0.85",
          },
          "50%": {
            transform: "translate(-47%, 14px) scale(1.08)",
            opacity: "1",
          },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(16px, -12px)" },
        },
        shoot: {
          "0%": { transform: "translate(0, 0)", opacity: "0" },
          "4%": { opacity: "1" },
          "13%": { transform: "translate(280px, 160px)", opacity: "0" },
          "100%": { transform: "translate(280px, 160px)", opacity: "0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        twinkle: "twinkle 4s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        drift: "drift 22s ease-in-out infinite",
        shoot: "shoot 12s ease-in-out infinite",
        rise: "rise 0.6s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
  darkMode: ["class"],
};
