import { clsx } from "clsx";

/**
 * Mono "// label" eyebrow — the relaunch section-label convention.
 * Usage: <Eyebrow>01 — Color</Eyebrow>  →  // 01 — Color
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "font-mono text-xs uppercase tracking-[0.25em] text-accent",
        className,
      )}
    >
      <span className="text-faint">{"// "}</span>
      {children}
    </p>
  );
}
