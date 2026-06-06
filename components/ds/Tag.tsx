import { clsx } from "clsx";

type TagVariant = "default" | "accent" | "soft";

const variants: Record<TagVariant, string> = {
  default: "border border-hairline text-muted",
  accent: "bg-accent text-black font-semibold",
  soft: "bg-accent/10 text-accent-soft",
};

/**
 * Mono pill used for skills/tags/labels (e.g. LLM, AI-native, Featured).
 */
export function Tag({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 font-mono text-xs",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
