"use client";

/* ============================================================
   TerminalShell — the shared interactive shell behind both the
   404 (not-found) and 500 (error) pages. A tiny working terminal:
   type `help`, `ls` the site's pages, `open jobs` to jump around.
   Lives inside the normal app shell (rails intact).

   Variant pages (NotFound, the error boundary) supply only what
   differs — the banner art, the intro lines, the status `code`,
   and any extra commands (e.g. `retry` on the 500). Everything
   else — boot sequence, command parser, history, prompt, chrome
   — lives here so the two pages can never drift apart.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- palette helpers for terminal lines (mapped to relaunch tokens) ---- */
export const C = {
  user: "rgb(var(--color-accent))",
  path: "rgb(var(--color-accent-soft))",
  punc: "rgb(var(--color-faint))",
  out: "rgb(var(--color-muted))",
  key: "rgb(var(--color-fg))",
  err: "rgb(var(--color-danger))",
  hi: "rgb(var(--color-accent-soft))",
  faint: "rgb(var(--color-faint))",
};

export type Seg = { t: string; c: string };
export type Entry =
  | { type: "line"; parts: Seg[] }
  | { type: "art" }
  | { type: "gap" };

export const seg = (t: string, c?: string): Seg => ({ t, c: c || C.out });
export const line = (...parts: Seg[]): Entry => ({ type: "line", parts });
export const art = (): Entry => ({ type: "art" });
export const gap = (): Entry => ({ type: "gap" });

/* Turn an ASCII banner (rows of `█` and spaces) into a 0/1 bitmap grid. The art
   is rendered as a CSS-grid of accent squares rather than block glyphs (`█`) —
   JetBrains Mono has no full-block glyph, so a font fallback would render it at
   a non-monospace width and shear the art apart. */
export const makeGrid = (rows: string[]): number[][] =>
  rows.map((row) => [...row].map((ch) => (ch === "█" ? 1 : 0)));

function Banner({ grid }: { grid: number[][] }) {
  const cols = grid[0].length;
  const cells = grid.flat();
  return (
    <div
      aria-hidden
      className="my-1 inline-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 9px)`,
        gridAutoRows: "9px",
      }}
    >
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-accent-soft" : undefined} />
      ))}
    </div>
  );
}

/* The site map the shell knows how to reach (real Codú routes). */
type Route = { path: string; label: string; names: string[]; desc: string };
const ROUTES: Route[] = [
  { path: "/", label: "home", names: ["home", "feed", "index"], desc: "latest from the community" },
  { path: "/discussions", label: "discussions", names: ["discussions", "discussion", "threads", "ask"], desc: "questions & threads" },
  { path: "/jobs", label: "jobs", names: ["jobs", "job", "hiring", "work"], desc: "roles for product engineers" },
  { path: "/notifications", label: "notifications", names: ["notifications", "notifs", "inbox"], desc: "your mentions & replies" },
  { path: "/saved", label: "saved", names: ["saved", "bookmarks"], desc: "posts you bookmarked" },
  { path: "/settings", label: "settings", names: ["settings", "config", "prefs", "account"], desc: "account & topics" },
];
const resolveRoute = (q: string): Route | null => {
  if (!q) return null;
  q = q.toLowerCase().replace(/\/$/, "");
  return (
    ROUTES.find((r) => r.names.includes(q)) ||
    ROUTES.find((r) => r.names.some((n) => n.startsWith(q))) ||
    null
  );
};

const makePrompt = (handle: string): Seg[] => [
  seg(`${handle}@codu`, C.user),
  seg(":", C.punc),
  seg("~/", C.path),
  seg("$ ", C.punc),
];

function TerminalLine({ entry, grid }: { entry: Entry; grid: number[][] }) {
  if (entry.type === "gap") return <div style={{ height: "0.85em" }} />;
  if (entry.type === "art") return <Banner grid={grid} />;
  return (
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {entry.parts.map((p, i) => (
        <span key={i} style={{ color: p.c }}>
          {p.t}
        </span>
      ))}
    </div>
  );
}

/* A variant-supplied command: returns lines to print, or "CLEAR" to wipe. */
export type CommandResult = Entry[] | "CLEAR";
export type ExtraCommand = () => CommandResult;

export interface TerminalShellProps {
  /** Status code — drives the titlebar, `pwd`, the art-reprint command, flavor. */
  code: string;
  /** The status-code banner, as an ASCII bitmap (see `makeGrid`). */
  banner: number[][];
  /** Variant intro lines, revealed one at a time on boot. Use `art()` for the banner. */
  intro: Entry[];
  /** Extra commands keyed by name (e.g. `{ retry: () => {...} }`). Built-ins win. */
  extraCommands?: Record<string, ExtraCommand>;
  /** Extra rows appended to the `help` menu: `[command, description]`. */
  extraHelp?: [string, string][];
}

function Shell({ code, banner, intro, extraCommands, extraHelp }: TerminalShellProps) {
  const router = useRouter();

  const nav = (path: string) => {
    router.push(path);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };
  // Open the shell's ⌘K command palette via its global keydown listener.
  // No-ops gracefully on routes rendered outside the app shell.
  const openSearch = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
    );
  };
  const join = () => router.push("/get-started");

  const { data: session } = useSession();
  // The handle `whoami` greets you with when logged in (real shells print the
  // current user). Falls back to display name, then a generic token.
  const username = session?.user?.username || session?.user?.name || null;
  // Personalize the shell prompt with the logged-in handle; guests stay `guest`.
  const prompt = makePrompt(username ?? "guest");

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [booted, setBooted] = useState(0); // how many intro lines are visible
  const [cleared, setCleared] = useState(false);
  const [log, setLog] = useState<Entry[]>([]); // user echoes + command output
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const cmdHist = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const reduce = useRef(prefersReducedMotion());

  /* boot sequence — reveals one intro line at a time, then hands over the prompt.
     State-driven (no chained-closure timers) so `ready` always flips. */
  useEffect(() => {
    if (reduce.current) {
      setBooted(intro.length);
      setReady(true);
      return;
    }
    if (booted >= intro.length) {
      if (!ready) setReady(true);
      return;
    }
    const prev = booted === 0 ? null : intro[booted - 1];
    const delay = booted === 0 ? 240 : prev && prev.type === "gap" ? 90 : 230;
    const t = setTimeout(() => setBooted((b) => b + 1), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  const history = cleared ? log : [...intro.slice(0, booted), ...log];

  /* keep pinned to the newest line (never use scrollIntoView) */
  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [booted, log, ready]);
  useEffect(() => {
    if (ready && inputRef.current)
      inputRef.current.focus({ preventScroll: true });
  }, [ready]);

  const helpOut = (): Entry[] => {
    const rows: [string, string][] = [
      ["ls", "list the pages on Codú"],
      ["open <page>", "jump to a page — e.g. open jobs"],
      ...(extraHelp ?? []),
      ["search", "open search (⌘K)"],
      ["whoami", "who's asking?"],
      ["clear", "wipe the screen"],
      ["help", "this menu"],
    ];
    return [
      line(seg("Commands you can run here:", C.key)),
      ...rows.map(([c, d]) =>
        line(seg("  " + c.padEnd(14), C.hi), seg(d, C.faint)),
      ),
      line(
        seg("Tip: ", C.faint),
        seg("prefixes are enough — ", C.out),
        seg("open di", C.hi),
        seg(" opens discussions.", C.out),
      ),
    ];
  };
  const lsOut = (): Entry[] => [
    line(seg("drwxr-xr-x  ", C.faint), seg("codu.co/", C.path)),
    ...ROUTES.map((r) =>
      line(seg("  " + (r.label + "/").padEnd(16), C.user), seg(r.desc, C.faint)),
    ),
    line(
      seg("  " + "get-started/".padEnd(16), C.hi),
      seg("join the builders — it’s free", C.faint),
    ),
  ];

  const run = (raw: string): CommandResult => {
    const cmd = raw.trim();
    if (!cmd) return [];
    const [name, ...args] = cmd.split(/\s+/);
    const n = name.toLowerCase();
    const arg = (args[0] || "").toLowerCase();

    if (n === "help" || n === "man" || n === "?") return helpOut();
    if (n === "ls" || n === "dir" || n === "ll") return lsOut();
    if (n === "clear" || n === "cls") return "CLEAR";
    if (n === "search" || n === "find" || n === "/") {
      openSearch();
      return [line(seg("opening search… ", C.out), seg("(⌘K)", C.faint))];
    }
    if (n === "whoami") {
      // Logged in: print the username, like a real `whoami`. Logged out: keep
      // the guest greeting that nudges you to join.
      if (username)
        return [
          line(
            seg(`${username}@codu`, C.user),
            seg(" — you're in. welcome back.", C.out),
          ),
        ];
      return [
        line(seg("guest@codu", C.user), seg(" — just passing through.", C.out)),
        line(
          seg("reading's free. type ", C.out),
          seg("join", C.hi),
          seg(" to build with us.", C.out),
        ),
      ];
    }
    if (n === "pwd") return [line(seg(`/dev/null/${code}`, C.out))];
    if (n === "date") return [line(seg(new Date().toString(), C.out))];
    if (n === "echo") return [line(seg(args.join(" "), C.out))];
    if (n === "sudo")
      return [line(seg("permission denied: ", C.err), seg("nice try 😏", C.out))];
    if (n === "coffee" || n === "make")
      return [
        line(
          seg("☕ brewing… ", C.out),
          seg(`ERR: this server only serves ${code}s.`, C.err),
        ),
      ];
    if (n === code) return [art()];
    if (n === "exit" || n === "quit" || n === "q")
      return [
        line(seg("there’s no escape from here… try ", C.out), seg("home", C.hi)),
      ];
    if (n === "history")
      return cmdHist.current.length
        ? cmdHist.current.map((c, i) =>
            line(
              seg("  " + String(i + 1).padStart(3) + "  ", C.faint),
              seg(c, C.out),
            ),
          )
        : [line(seg("(no history yet)", C.faint))];
    if (n === "join" || (n === "open" && (arg === "get-started" || arg === "join"))) {
      join();
      return [line(seg("→ ", C.hi), seg("opening get-started…", C.out))];
    }

    // navigation: `open <page>` / `cd <page>` / `goto <page>` / bare page name
    if (["open", "cd", "goto", "go"].includes(n)) {
      if (!arg)
        return [
          line(
            seg("usage: open <page>", C.err),
            seg("   — run ", C.faint),
            seg("ls", C.hi),
            seg(" to see them", C.faint),
          ),
        ];
      const r = resolveRoute(arg);
      if (r) {
        nav(r.path);
        return [line(seg("→ ", C.hi), seg("opening " + r.label + "…", C.out))];
      }
      return [
        line(
          seg("no page called ", C.err),
          seg(arg, C.key),
          seg(". try ", C.err),
          seg("ls", C.hi),
        ),
      ];
    }
    const direct = resolveRoute(n);
    if (direct && direct.names.includes(n)) {
      nav(direct.path);
      return [line(seg("→ ", C.hi), seg("opening " + direct.label + "…", C.out))];
    }

    // variant-supplied commands (e.g. `retry` on the 500). Checked after the
    // built-ins so a variant can add verbs but never shadow the core shell.
    const extra = extraCommands?.[n];
    if (extra) return extra();

    return [
      line(
        seg("zsh: command not found: ", C.err),
        seg(n, C.key),
        seg("  — type ", C.faint),
        seg("help", C.hi),
      ),
    ];
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input;
    const echo: Entry = { type: "line", parts: [...prompt, seg(raw, C.key)] };
    const out = run(raw);
    if (raw.trim()) cmdHist.current = [...cmdHist.current, raw];
    histIdx.current = -1;
    if (out === "CLEAR") {
      setCleared(true);
      setLog([]);
    } else {
      setLog((l) => [...l, echo, ...out]);
    }
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = cmdHist.current;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!list.length) return;
      histIdx.current =
        histIdx.current < 0 ? list.length - 1 : Math.max(0, histIdx.current - 1);
      setInput(list[histIdx.current]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx.current < 0) return;
      histIdx.current += 1;
      if (histIdx.current >= list.length) {
        histIdx.current = -1;
        setInput("");
      } else setInput(list[histIdx.current]);
    }
  };

  return (
    <div
      className="cursor-text overflow-hidden rounded-lg border border-hairline bg-inset shadow-pop"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center gap-2 border-b border-hairline bg-surface px-5 py-2.5">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger" />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" />
        <span className="ml-2 font-mono text-[11px] text-faint">
          guest@codu — {code} — zsh
        </span>
      </div>
      <div
        ref={bodyRef}
        className="max-h-[60vh] min-h-[300px] overflow-y-auto px-6 py-5 font-mono text-[13px] leading-[1.7] text-muted [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-strong [&::-webkit-scrollbar]:w-2"
      >
        {history.map((entry, i) => (
          <TerminalLine key={i} entry={entry} grid={banner} />
        ))}
        {ready && (
          <form
            onSubmit={submit}
            style={{ display: "flex", alignItems: "center", marginTop: 2 }}
          >
            {prompt.map((p, i) => (
              <span key={i} style={{ color: p.c, whiteSpace: "pre" }}>
                {p.t}
              </span>
            ))}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal input"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[13px] leading-[1.7] text-fg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ caretColor: "rgb(var(--color-accent))" }}
            />
          </form>
        )}
      </div>
    </div>
  );
}

/** The full centered terminal panel (dotted-grid backdrop + shell), shared by
    the 404 and 500 pages so their framing stays identical. */
export default function TerminalShell(props: TerminalShellProps) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden px-4 pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-10%] bg-grid-dots bg-[length:22px_22px] opacity-40"
        style={{
          maskImage: "radial-gradient(60% 55% at 50% 42%, #000, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(60% 55% at 50% 42%, #000, transparent 78%)",
        }}
      />
      <div className="relative w-full max-w-[600px]">
        <Shell {...props} />
      </div>
    </div>
  );
}
