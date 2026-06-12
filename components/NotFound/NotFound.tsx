"use client";

/* ============================================================
   NotFound — the center-column 404. A thin variant over the
   shared TerminalShell: it supplies the "404" banner and the
   intro copy; the shell provides the working terminal (type
   `help`, `ls` the pages, `open jobs`). Rails stay intact.
   ============================================================ */

import { usePathname } from "next/navigation";
import TerminalShell, {
  C,
  art,
  gap,
  line,
  makeGrid,
  seg,
} from "@/components/Terminal/TerminalShell";

/* The "404" hero, as an ASCII bitmap (see makeGrid). */
const BANNER_404 = makeGrid([
  "█   █   █████   █   █",
  "█   █   █   █   █   █",
  "█████   █   █   █████",
  "    █   █   █       █",
  "    █   █████       █",
]);

export default function NotFound() {
  const pathname = usePathname();
  const route = pathname || "/the-page-you-wanted";

  const intro = [
    art(),
    gap(),
    line(seg("$ ", C.punc), seg("codu navigate ", C.out), seg(route, C.path)),
    line(seg("  ✗ 404: ", C.err), seg("nothing shipped to this route (yet)", C.out)),
    line(seg("  ↳ not all who wander are lost — some are just debugging in prod 🔥", C.hi)),
    gap(),
    line(seg("Type ", C.out), seg("help", C.hi), seg(" to find your way around.", C.out)),
    gap(),
  ];

  return <TerminalShell code="404" banner={BANNER_404} intro={intro} />;
}
