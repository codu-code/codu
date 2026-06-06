import { notFound } from "next/navigation";

// Dev-only LIVING DESIGN SYSTEM. Not reachable in production builds.
// Add/remove component + pattern sections here as we build out real pages —
// this page is the canonical reference for the Codú relaunch system.
export const metadata = {
  title: "Design System — Codú (dev only)",
  robots: { index: false, follow: false },
};

// Locked: Mint accent, dark-first, cool neutrals. Uses the app's global fonts
// (--font-display / --font-sans / --font-mono from the root layout).
const theme = {
  "--ks-canvas": "#0a0b0e",
  "--ks-surface": "#121419",
  "--ks-surface-2": "#181b22",
  "--ks-border": "#242832",
  "--ks-text": "#f3f6f9",
  "--ks-muted": "#9aa4b2",
  "--ks-faint": "#5b6472",
  "--ks-accent": "#2dd4bf",
  "--ks-accent-soft": "#5eead4",
} as React.CSSProperties;

const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

// Default section header: editorial / technical-journal — a number, a hairline,
// and a display-font title. (Deliberately NOT the "// label" dev-tool trope.)
function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-14">
      <div className="mb-8 flex items-baseline gap-4">
        <span
          className="text-sm"
          style={{ fontFamily: "var(--font-mono)", color: "var(--ks-accent)" }}
        >
          {n}
        </span>
        <div className="h-px flex-none" style={{ width: 28, background: "var(--ks-border)" }} />
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--ks-text)" }}
        >
          {title}
        </h2>
        <div className="h-px flex-1" style={{ background: "var(--ks-border)" }} />
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 rounded-lg border"
        style={{ background: value, borderColor: "var(--ks-border)" }}
      />
      <div style={{ fontFamily: "var(--font-mono)" }} className="text-xs">
        <div style={{ color: "var(--ks-text)" }}>{name}</div>
        <div style={{ color: "var(--ks-faint)" }}>{value}</div>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div
      className="min-h-screen"
      style={{
        ...theme,
        background: "var(--ks-canvas)",
        color: "var(--ks-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: grain,
          opacity: 0.04,
          pointerEvents: "none",
          mixBlendMode: "overlay",
          zIndex: 50,
        }}
      />

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* ───────── Header ───────── */}
        <header className="border-b pb-12" style={{ borderColor: "var(--ks-border)" }}>
          <p
            style={{ fontFamily: "var(--font-mono)", color: "var(--ks-faint)" }}
            className="text-xs uppercase tracking-[0.3em]"
          >
            codu · living design system · dev only
          </p>
          <h1
            className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Design System
            <span style={{ color: "var(--ks-accent)" }}>.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg" style={{ color: "var(--ks-muted)" }}>
            The canonical reference for the relaunch. Direction:{" "}
            <em style={{ color: "var(--ks-text)" }}>fresh &amp; editorial</em> — cool
            dark canvas, Mint accent, characterful type, hairline rules over soft
            shadows. Add or remove sections here as we build real pages.
          </p>
        </header>

        {/* ═══ FOUNDATIONS ═══ */}
        <Section n="01" title="Color">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Swatch name="canvas" value="#0a0b0e" />
            <Swatch name="surface" value="#121419" />
            <Swatch name="surface-2" value="#181b22" />
            <Swatch name="border" value="#242832" />
            <Swatch name="accent · mint" value="#2dd4bf" />
          </div>
        </Section>

        <Section n="02" title="Typography">
          <div className="space-y-6">
            <div>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ks-faint)" }} className="text-xs">
                Display — Bricolage Grotesque
              </span>
              <p className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Where builders ship with AI
              </p>
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ks-faint)" }} className="text-xs">
                Body — Hanken Grotesk
              </span>
              <p className="max-w-2xl text-lg" style={{ color: "var(--ks-muted)" }}>
                Learn to build with AI, share what you ship, and grow with people doing
                the same. Calm, readable body copy lets the headlines and accent talk.
              </p>
            </div>
            <div>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ks-faint)" }} className="text-xs">
                Mono — JetBrains Mono
              </span>
              <p style={{ fontFamily: "var(--font-mono)", color: "var(--ks-accent-soft)" }}>
                $ npx create-codu-app --ai
              </p>
            </div>
          </div>
        </Section>

        {/* The label-treatment question, made visual */}
        <Section n="03" title="Section labels — pick a treatment">
          <p className="mb-6 max-w-2xl text-sm" style={{ color: "var(--ks-muted)" }}>
            Honest note: the{" "}
            <code style={{ fontFamily: "var(--font-mono)" }}>{"//"}</code>{" "}
            mono label is a common dev-tool convention (Vercel, Resend, Railway…), so it
            reads as &ldquo;technical startup&rdquo; rather than distinctive. Three
            options, least → most distinctive:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* A: code-comment (most common) */}
            <div className="rounded-lg border p-5" style={{ borderColor: "var(--ks-border)", background: "var(--ks-surface)" }}>
              <p className="text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)", color: "var(--ks-accent)" }}>
                {"// 01 — color"}
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--ks-faint)" }}>
                A · code-comment. Common / dev-tool default.
              </p>
            </div>
            {/* B: slash separator */}
            <div className="rounded-lg border p-5" style={{ borderColor: "var(--ks-border)", background: "var(--ks-surface)" }}>
              <p className="text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)", color: "var(--ks-accent)" }}>
                01 / color
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--ks-faint)" }}>
                B · slash. Technical, less &ldquo;code-y&rdquo;.
              </p>
            </div>
            {/* C: editorial number + rule (used on this page) */}
            <div className="rounded-lg border p-5" style={{ borderColor: "var(--ks-border)", background: "var(--ks-surface)" }}>
              <div className="flex items-baseline gap-3">
                <span className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--ks-accent)" }}>01</span>
                <div className="h-px w-6" style={{ background: "var(--ks-border)" }} />
                <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>Color</span>
              </div>
              <p className="mt-3 text-xs" style={{ color: "var(--ks-faint)" }}>
                C · editorial number + rule. Most distinctive (used on this page).
              </p>
            </div>
          </div>
        </Section>

        {/* ═══ COMPONENTS ═══ */}
        <Section n="04" title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5" style={{ background: "var(--ks-accent)" }}>
              Primary — Join free
            </button>
            <button className="rounded-lg border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--ks-border)", color: "var(--ks-text)" }}>
              Secondary — Browse feed
            </button>
            <button className="text-sm font-semibold" style={{ color: "var(--ks-accent)", fontFamily: "var(--font-mono)" }}>
              Ghost ›
            </button>
          </div>
        </Section>

        <Section n="05" title="Form controls">
          <div className="grid max-w-xl gap-4">
            <label className="text-sm" style={{ color: "var(--ks-muted)" }}>
              Email
              <input
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-[var(--ks-accent)]"
                style={{ borderColor: "var(--ks-border)", color: "var(--ks-text)" }}
              />
            </label>
            <label className="text-sm" style={{ color: "var(--ks-muted)" }}>
              What are you building?
              <textarea
                rows={3}
                placeholder="An AI changelog generator…"
                className="mt-1.5 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-[var(--ks-accent)]"
                style={{ borderColor: "var(--ks-border)", color: "var(--ks-text)" }}
              />
            </label>
          </div>
        </Section>

        <Section n="06" title="Tags & badges">
          <div className="flex flex-wrap gap-2" style={{ fontFamily: "var(--font-mono)" }}>
            {["LLM", "agents", "RAG", "Next.js", "vibe-coding"].map((t) => (
              <span key={t} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--ks-border)", color: "var(--ks-muted)" }}>
                {t}
              </span>
            ))}
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ background: "var(--ks-accent)" }}>
              Featured
            </span>
            <span className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(45,212,191,0.12)", color: "var(--ks-accent-soft)" }}>
              AI-native
            </span>
          </div>
        </Section>

        <Section n="07" title="Card — job listing">
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--ks-border)", background: "var(--ks-surface)" }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-black" style={{ background: "var(--ks-accent)" }}>
                A
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Founding AI Engineer
                  </h3>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-black" style={{ background: "var(--ks-accent)" }}>
                    Featured
                  </span>
                </div>
                <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--ks-muted)" }}>
                  Acme AI · Remote (EU)
                </p>
                <div className="mt-3 flex flex-wrap gap-2" style={{ fontFamily: "var(--font-mono)" }}>
                  {["Full-time", "AI-native", "LLM", "agents"].map((t) => (
                    <span key={t} className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--ks-border)", color: "var(--ks-muted)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ PATTERNS ═══ */}
        <Section n="08" title="Pattern — hero (editorial, no bento/blob)">
          <div className="relative overflow-hidden rounded-2xl border p-10 sm:p-16" style={{ borderColor: "var(--ks-border)", background: "var(--ks-surface)" }}>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(var(--ks-border) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
                opacity: 0.5,
              }}
            />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)", color: "var(--ks-accent)" }}>
                the community for AI builders
              </p>
              <h2 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
                Learn to build with AI.{" "}
                <span style={{ color: "var(--ks-accent)" }}>Ship</span> what you make.
              </h2>
              <p className="mt-5 max-w-lg text-lg" style={{ color: "var(--ks-muted)" }}>
                Tutorials, a curated feed, and a community of indie hackers and AI
                builders doing the work.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button className="rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5" style={{ background: "var(--ks-accent)" }}>
                  Join free
                </button>
                <button className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--ks-text)" }}>
                  Browse the feed ›
                </button>
              </div>
            </div>
          </div>
        </Section>

        <footer className="border-t pt-8 text-xs" style={{ borderColor: "var(--ks-border)", fontFamily: "var(--font-mono)", color: "var(--ks-faint)" }}>
          /kitchen-sink · app/kitchen-sink/page.tsx · dev-only (NODE_ENV gate) · grow me
        </footer>
      </div>
    </div>
  );
}
