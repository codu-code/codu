// Ambient hero backdrop — refined, restrained motion (constellation + aurora +
// occasional shooting star). Reduced-motion users get a calm static layer.
// Deterministic positions (no Math.random) so SSR and client match.

const STARS: { x: number; y: number; s: number; d: number }[] = [
  { x: 8, y: 18, s: 2, d: 0 },
  { x: 16, y: 62, s: 1.5, d: 1.2 },
  { x: 23, y: 31, s: 2.5, d: 2.1 },
  { x: 29, y: 78, s: 1.5, d: 0.6 },
  { x: 35, y: 12, s: 2, d: 3.0 },
  { x: 41, y: 49, s: 1.5, d: 1.8 },
  { x: 47, y: 84, s: 2, d: 2.6 },
  { x: 53, y: 22, s: 1.5, d: 0.4 },
  { x: 59, y: 58, s: 2.5, d: 1.5 },
  { x: 64, y: 9, s: 1.5, d: 3.2 },
  { x: 69, y: 70, s: 2, d: 0.9 },
  { x: 74, y: 38, s: 1.5, d: 2.3 },
  { x: 80, y: 80, s: 2, d: 1.1 },
  { x: 85, y: 20, s: 2.5, d: 2.8 },
  { x: 90, y: 55, s: 1.5, d: 0.7 },
  { x: 94, y: 33, s: 2, d: 1.9 },
  { x: 12, y: 40, s: 1.5, d: 2.4 },
  { x: 38, y: 66, s: 1.5, d: 0.3 },
  { x: 56, y: 41, s: 2, d: 3.1 },
  { x: 71, y: 88, s: 1.5, d: 1.4 },
  { x: 88, y: 72, s: 1.5, d: 2.0 },
  { x: 20, y: 8, s: 2, d: 1.0 },
  { x: 45, y: 28, s: 1.5, d: 2.7 },
  { x: 67, y: 24, s: 2, d: 0.5 },
];

export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Dotted grid, masked toward the centre */}
      <div className="absolute inset-0 bg-grid-dots bg-[length:26px_26px] opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_28%,black,transparent)]" />

      {/* Aurora glows (drift slowly; static for reduced motion) */}
      <div className="absolute left-1/2 top-[-18%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px] motion-safe:animate-aurora" />
      <div className="absolute left-[18%] top-[24%] h-[280px] w-[280px] rounded-full bg-accent/5 blur-[110px] motion-safe:animate-drift" />

      {/* Constellation */}
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-fg/50 opacity-30 motion-safe:animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.s}px`,
            height: `${star.s}px`,
            animationDelay: `${star.d}s`,
          }}
        />
      ))}

      {/* Occasional shooting stars (motion only) */}
      <span
        className="absolute left-[12%] top-[14%] hidden h-px w-16 bg-gradient-to-r from-accent to-transparent opacity-0 motion-safe:block motion-safe:animate-shoot"
        style={{ animationDelay: "3s" }}
      />
      <span
        className="absolute left-[58%] top-[8%] hidden h-px w-20 bg-gradient-to-r from-accent-soft to-transparent opacity-0 motion-safe:block motion-safe:animate-shoot"
        style={{ animationDelay: "8.5s" }}
      />
    </div>
  );
}
