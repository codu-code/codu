import { notFound } from "next/navigation";
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";

// Dev-only design playground. Not reachable in production builds.
export const metadata = {
  title: "Kitchen Sink — Codú design playground (dev only)",
  robots: { index: false, follow: false },
};

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--ks-display",
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--ks-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--ks-mono",
  display: "swap",
});

// Proposed FRESH direction — cool near-black canvas, one crisp accent.
// No orange, no pink, no gradients.
const theme = {
  "--ks-canvas": "#0a0b0e",
  "--ks-surface": "#121419",
  "--ks-surface-2": "#181b22",
  "--ks-border": "#242832",
  "--ks-text": "#f3f6f9",
  "--ks-muted": "#9aa4b2",
  "--ks-faint": "#5b6472",
  "--ks-accent": "#2dd4bf", // primary: fresh mint-teal
  "--ks-accent-soft": "#5eead4",
} as React.CSSProperties;

// Fresh accent options to compare (no orange/pink).
const ACCENTS = [
  { name: "Mint", value: "#2dd4bf", soft: "#5eead4" },
  { name: "Lime", value: "#a3e635", soft: "#bef264" },
  { name: "Sky", value: "#38bdf8", soft: "#7dd3fc" },
  { name: "Iris", value: "#818cf8", soft: "#a5b4fc" },
];

// Subtle film grain for atmosphere (inline SVG, no asset needed).
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p
      className="mb-4 text-xs uppercase tracking-[0.25em]"
      style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-accent)" }}
    >
      <span style={{ color: "var(--ks-faint)" }}>{`// ${n} —`}</span>{" "}
      {children}
    </p>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 rounded-lg border"
        style={{ background: value, borderColor: "var(--ks-border)" }}
      />
      <div style={{ fontFamily: "var(--ks-mono)" }} className="text-xs">
        <div style={{ color: "var(--ks-text)" }}>{name}</div>
        <div style={{ color: "var(--ks-faint)" }}>{value}</div>
      </div>
    </div>
  );
}

// A mini hero rendered in a given accent, for side-by-side comparison.
function AccentPreview({
  name,
  value,
  soft,
}: {
  name: string;
  value: string;
  soft: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-6"
      style={{ borderColor: "var(--ks-border)", background: "var(--ks-surface)" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.25em]"
        style={{ fontFamily: "var(--ks-mono)", color: value }}
      >
        {`// ${name}`}
      </p>
      <h4
        className="mt-3 text-2xl font-extrabold leading-tight tracking-tight"
        style={{ fontFamily: "var(--ks-display)", color: "var(--ks-text)" }}
      >
        Ship what you <span style={{ color: value }}>build</span>.
      </h4>
      <div className="mt-4 flex items-center gap-3">
        <button
          className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-black"
          style={{ background: value }}
        >
          Join free
        </button>
        <span
          className="rounded-full border px-2.5 py-1 text-[10px]"
          style={{ borderColor: "var(--ks-border)", color: soft, fontFamily: "var(--ks-mono)" }}
        >
          AI-native
        </span>
      </div>
    </div>
  );
}

export default function KitchenSinkPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen`}
      style={{
        ...theme,
        background: "var(--ks-canvas)",
        color: "var(--ks-text)",
        fontFamily: "var(--ks-body)",
      }}
    >
      {/* grain overlay */}
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
        <header
          className="border-b pb-12"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <p
            style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-faint)" }}
            className="text-xs uppercase tracking-[0.3em]"
          >
            codu · design playground · dev only
          </p>
          <h1
            className="mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl"
            style={{ fontFamily: "var(--ks-display)" }}
          >
            Kitchen Sink
            <span style={{ color: "var(--ks-accent)" }}>.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg" style={{ color: "var(--ks-muted)" }}>
            A canvas for the Codú redesign. Direction:{" "}
            <em style={{ color: "var(--ks-text)" }}>fresh &amp; editorial</em> — a
            cool dark canvas, characterful headlines, mono micro-labels, and a
            single crisp accent. No orange, no pink, no gradients.
          </p>
        </header>

        {/* ───────── Accent options ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="01">Pick an accent — same UI, four fresh options</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACCENTS.map((a) => (
              <AccentPreview
                key={a.name}
                name={a.name}
                value={a.value}
                soft={a.soft}
              />
            ))}
          </div>
          <p className="mt-6 text-sm" style={{ color: "var(--ks-muted)" }}>
            Tell me which accent feels right (or name another) and I&apos;ll lock
            the whole system to it. The rest of this page uses{" "}
            <span style={{ color: "var(--ks-accent)" }}>Mint</span> as a placeholder.
          </p>
        </section>

        {/* ───────── Color ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="02">Neutrals (cool, not warm)</Eyebrow>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Swatch name="canvas" value="#0a0b0e" />
            <Swatch name="surface" value="#121419" />
            <Swatch name="surface-2" value="#181b22" />
            <Swatch name="border" value="#242832" />
            <Swatch name="accent" value="#2dd4bf" />
          </div>
        </section>

        {/* ───────── Typography ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="03">Typography</Eyebrow>
          <div className="space-y-6">
            <div>
              <span
                style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-faint)" }}
                className="text-xs"
              >
                Display — Bricolage Grotesque
              </span>
              <p
                className="text-5xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--ks-display)" }}
              >
                Where builders ship with AI
              </p>
            </div>
            <div>
              <span
                style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-faint)" }}
                className="text-xs"
              >
                Body — Hanken Grotesk
              </span>
              <p
                className="max-w-2xl text-lg"
                style={{ color: "var(--ks-muted)" }}
              >
                Learn to build with AI, share what you ship, and grow with people
                doing the same. Calm, readable body copy lets the headlines and the
                accent do the talking.
              </p>
            </div>
            <div>
              <span
                style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-faint)" }}
                className="text-xs"
              >
                Mono — JetBrains Mono (labels, tags, code)
              </span>
              <p
                style={{
                  fontFamily: "var(--ks-mono)",
                  color: "var(--ks-accent-soft)",
                }}
              >
                $ npx create-codu-app --ai
              </p>
            </div>
          </div>
        </section>

        {/* ───────── Buttons ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="04">Buttons</Eyebrow>
          <div className="flex flex-wrap items-center gap-4">
            <button
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--ks-accent)" }}
            >
              Primary — Join free
            </button>
            <button
              className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
              style={{ borderColor: "var(--ks-border)", color: "var(--ks-text)" }}
            >
              Secondary — Browse feed
            </button>
            <button
              className="rounded-lg px-5 py-2.5 text-sm font-semibold"
              style={{ color: "var(--ks-accent)", fontFamily: "var(--ks-mono)" }}
            >
              Ghost ›
            </button>
          </div>
        </section>

        {/* ───────── Form ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="05">Form controls</Eyebrow>
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
        </section>

        {/* ───────── Tags / badges ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="06">Tags &amp; badges</Eyebrow>
          <div
            className="flex flex-wrap gap-2"
            style={{ fontFamily: "var(--ks-mono)" }}
          >
            {["LLM", "agents", "RAG", "Next.js", "vibe-coding"].map((t) => (
              <span
                key={t}
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: "var(--ks-border)", color: "var(--ks-muted)" }}
              >
                {t}
              </span>
            ))}
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-black"
              style={{ background: "var(--ks-accent)" }}
            >
              Featured
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs"
              style={{
                background: "rgba(45,212,191,0.12)",
                color: "var(--ks-accent-soft)",
              }}
            >
              AI-native
            </span>
          </div>
        </section>

        {/* ───────── Cards ───────── */}
        <section
          className="border-b py-14"
          style={{ borderColor: "var(--ks-border)" }}
        >
          <Eyebrow n="07">Cards — job listing</Eyebrow>
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--ks-border)",
              background: "var(--ks-surface)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-black"
                style={{ background: "var(--ks-accent)" }}
              >
                A
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: "var(--ks-display)" }}
                  >
                    Founding AI Engineer
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-black"
                    style={{ background: "var(--ks-accent)" }}
                  >
                    Featured
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--ks-mono)",
                    color: "var(--ks-muted)",
                  }}
                >
                  Acme AI · Remote (EU)
                </p>
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  style={{ fontFamily: "var(--ks-mono)" }}
                >
                  {["Full-time", "AI-native", "LLM", "agents"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border px-2 py-0.5 text-xs"
                      style={{
                        borderColor: "var(--ks-border)",
                        color: "var(--ks-muted)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Hero block ───────── */}
        <section className="py-14">
          <Eyebrow n="08">Hero block (applied)</Eyebrow>
          <div
            className="relative overflow-hidden rounded-2xl border p-10 sm:p-16"
            style={{
              borderColor: "var(--ks-border)",
              background: "var(--ks-surface)",
            }}
          >
            {/* dotted grid texture */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(var(--ks-border) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
                opacity: 0.5,
              }}
            />
            <div className="relative">
              <p
                className="text-xs uppercase tracking-[0.25em]"
                style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-accent)" }}
              >
                {"// the community for AI builders"}
              </p>
              <h2
                className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl"
                style={{ fontFamily: "var(--ks-display)" }}
              >
                Learn to build with AI.{" "}
                <span style={{ color: "var(--ks-accent)" }}>Ship</span> what you
                make.
              </h2>
              <p
                className="mt-5 max-w-lg text-lg"
                style={{ color: "var(--ks-muted)" }}
              >
                Tutorials, a curated feed, and a community of indie hackers and AI
                builders doing the work.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--ks-accent)" }}
                >
                  Join free
                </button>
                <button
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-text)" }}
                >
                  Browse the feed ›
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer
          className="pt-8 text-xs"
          style={{ fontFamily: "var(--ks-mono)", color: "var(--ks-faint)" }}
        >
          /kitchen-sink · edit app/kitchen-sink/page.tsx · dev-only (NODE_ENV gate)
        </footer>
      </div>
    </div>
  );
}
