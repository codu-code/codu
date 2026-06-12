"use client";

// Error boundary — the center-column 500. A thin TerminalShell variant (same
// engine as the 404) supplying the "500" banner, intro copy, and a `retry`
// command wired to reset(). The thrown error is reported to Sentry on mount.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import TerminalShell, {
  C,
  art,
  gap,
  line,
  makeGrid,
  seg,
  type CommandResult,
} from "@/components/Terminal/TerminalShell";

/* The "500" hero, as an ASCII bitmap (see makeGrid). */
const BANNER_500 = makeGrid([
  "█████   █████   █████",
  "█       █   █   █   █",
  "█████   █   █   █   █",
  "    █   █   █   █   █",
  "█████   █████   █████",
]);

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const route = pathname || "/somewhere";

  // Report the boundary's error once, on mount (and whenever a fresh error
  // replaces it). Matches global-error.tsx's capture so 500s are never silent.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const intro = [
    art(),
    gap(),
    line(seg("$ ", C.punc), seg("codu render ", C.out), seg(route, C.path)),
    line(seg("  ✗ 500: ", C.err), seg("the server tripped over its own feet", C.out)),
    ...(error.digest
      ? [line(seg("  ↳ ref: ", C.faint), seg(error.digest, C.key))]
      : []),
    line(seg("  ↳ it’s on us, not you — this one’s already logged 🛠️", C.hi)),
    gap(),
    line(
      seg("Type ", C.out),
      seg("retry", C.hi),
      seg(" to run it again, or ", C.out),
      seg("help", C.hi),
      seg(" to look around.", C.out),
    ),
    gap(),
  ];

  // `retry` re-renders the failed segment (React's reset); `reload` does a hard
  // reload as a fallback when the error is baked into the document.
  const extraCommands = {
    retry: (): CommandResult => {
      reset();
      return [line(seg("↻ ", C.hi), seg("retrying…", C.out))];
    },
    reload: (): CommandResult => {
      if (typeof window !== "undefined") window.location.reload();
      return [line(seg("↻ ", C.hi), seg("reloading…", C.out))];
    },
  };

  return (
    <TerminalShell
      code="500"
      banner={BANNER_500}
      intro={intro}
      extraCommands={extraCommands}
      extraHelp={[["retry", "run the failed request again"]]}
    />
  );
}
