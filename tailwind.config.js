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
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      colors: {
        black: "#040404",
        twitter: "#282828",
        github: "#f17f06",
        // Relaunch design tokens — driven by CSS vars (see styles/globals.css)
        // so they theme cleanly across dark/light. Use like bg-surface,
        // text-fg, text-accent, border-hairline, etc. Opacity modifiers give
        // the token "washes": bg-accent/10, bg-success/12, etc.
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        hover: "rgb(var(--color-hover) / <alpha-value>)",
        inset: "rgb(var(--color-inset) / <alpha-value>)",
        hairline: "rgb(var(--color-hairline) / <alpha-value>)",
        strong: "rgb(var(--color-strong) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        faint: "rgb(var(--color-faint) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        },
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
      },
      borderRadius: {
        // Handoff radii scale
        sm: "6px",
        md: "8px",
        lg: "12px", // cards
        xl: "16px", // panels
        "2xl": "22px", // hero blocks
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        pop: "var(--shadow-pop)",
        glow: "var(--shadow-glow)",
        "ring-focus": "var(--ring-focus)",
      },
      maxWidth: {
        container: "64rem", // 1024 — editorial column
        "container-wide": "75rem", // 1200 — app/marketing
        prose: "42rem", // 672 — article column
      },
      fontSize: {
        // Handoff type scale (1rem = 16px)
        xs: ["0.75rem", { lineHeight: "1.4" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.55" }],
        lg: ["1.125rem", { lineHeight: "1.55" }],
        xl: ["1.375rem", { lineHeight: "1.3" }],
        "2xl": ["1.75rem", { lineHeight: "1.08" }],
        "3xl": ["2.25rem", { lineHeight: "1.08" }],
        "4xl": ["3rem", { lineHeight: "1.0" }],
        "5xl": ["3.75rem", { lineHeight: "0.95" }],
        "6xl": ["4.75rem", { lineHeight: "0.95" }],
      },
      letterSpacing: {
        tighter: "-0.03em", // big display
        tight: "-0.015em", // heds
        label: "0.25em", // mono eyebrow labels
        "label-lg": "0.3em", // mono kicker
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "320ms",
      },
      backgroundImage: {
        discord: "linear-gradient(to bottom, #4b83fb, #734df8)",
        youtube: "linear-gradient(to top, #6d0202 22%, #c90000 61%)",
        // Subtle dotted grid for editorial atmosphere.
        // Pair with an arbitrary size, e.g. bg-grid-dots bg-[length:22px_22px]
        "grid-dots":
          "radial-gradient(rgb(var(--color-hairline)) 1px, transparent 1px)",
        // Hairline grid for structural section dividers (pair with 56px size).
        "grid-lines":
          "linear-gradient(rgb(var(--color-hairline)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-hairline)) 1px, transparent 1px)",
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
