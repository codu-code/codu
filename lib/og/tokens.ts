// Design tokens for the OG cards, resolved to literals. Satori (inside
// next/og) can't read CSS custom properties or oklch(), so every colour is a
// plain hex/rgba/hsl string lifted from the design system.

export const T = {
  // canvas ladder
  canvas: "#0a0b0e",
  surface: "#121419",
  elevated: "#181b22",
  inset: "#08090c",
  // borders
  hairline: "#242832",
  hairlineStrong: "#2f3440",
  // text
  primary: "#f4f6f8",
  muted: "#9aa3b0",
  faint: "#868f9b",
  // accent (Mint)
  accent: "#2dd4bf",
  accentSoft: "#6ee7d6",
  onAccent: "#04221d",
  // status
  info: "#5fa8f5",
  infoWash: "rgba(95,168,245,0.12)",
} as const;

export const FONT = {
  display: "Bricolage Grotesque",
  sans: "Hanken Grotesk",
  mono: "JetBrains Mono",
} as const;

// Avatar / publication-mark tints. The app uses oklch(0.5 0.08 H), which
// Satori can't parse, so these hsl values approximate it; the hue itself comes
// from the same hueFromString used on-site (see lib/og/url.ts).
export const avatarBg = (hue: number) => `hsl(${hue}, 22%, 42%)`;
export const pubBg = (hue: number) => `hsl(${hue}, 34%, 46%)`;

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

export const fmtK = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : "" + n;
