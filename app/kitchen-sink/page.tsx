import { notFound } from "next/navigation";
import { Eyebrow, Tag } from "@/components/ds";

// Dev-only LIVING DESIGN SYSTEM. Not reachable in production builds.
// Add/remove component + pattern sections here as we build real pages —
// this page is the canonical reference for the Codú relaunch system.
export const metadata = {
  title: "Design System — Codú (dev only)",
  robots: { index: false, follow: false },
};

// Film grain for atmosphere (one-off decorative data URI).
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

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
    <section className="border-t border-hairline py-14">
      <Eyebrow className="mb-7">{`${n} — ${title}`}</Eyebrow>
      {children}
    </section>
  );
}

// Color value is genuine data (we're displaying the swatch), so the hex is an
// inline background — everything else uses theme classes.
function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-20 rounded-lg border border-hairline"
        style={{ background: value }}
      />
      <div className="font-mono text-xs">
        <div className="text-fg">{name}</div>
        <div className="text-faint">{value}</div>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    // `dark` forces the canonical dark token values regardless of app theme.
    <div className="dark min-h-screen bg-canvas font-sans text-fg">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* ───────── Header ───────── */}
        <header className="pb-4">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-faint">
            codu · living design system · dev only
          </p>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            Design System<span className="text-accent">.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            The canonical reference for the relaunch. Direction:{" "}
            <em className="text-fg">fresh &amp; editorial</em> — cool dark canvas,
            Mint accent, characterful type, hairline rules over soft shadows. Add or
            remove sections here as we build real pages.
          </p>
        </header>

        {/* ═══ FOUNDATIONS ═══ */}
        <Section n="01" title="Color">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Swatch name="canvas" value="#0a0b0e" />
            <Swatch name="surface" value="#121419" />
            <Swatch name="elevated" value="#181b22" />
            <Swatch name="hairline" value="#242832" />
            <Swatch name="accent · mint" value="#2dd4bf" />
          </div>
          <p className="mt-6 text-sm text-muted">
            Used via theme classes: <code className="font-mono text-accent-soft">bg-surface</code>,{" "}
            <code className="font-mono text-accent-soft">text-fg</code>,{" "}
            <code className="font-mono text-accent-soft">text-accent</code>,{" "}
            <code className="font-mono text-accent-soft">border-hairline</code> — no
            inline colors.
          </p>
        </Section>

        <Section n="02" title="Typography">
          <div className="space-y-6">
            <div>
              <span className="font-mono text-xs text-faint">
                Display — Bricolage Grotesque (font-display)
              </span>
              <p className="font-display text-5xl font-extrabold tracking-tight">
                Where builders ship with AI
              </p>
            </div>
            <div>
              <span className="font-mono text-xs text-faint">
                Body — Hanken Grotesk (font-sans)
              </span>
              <p className="max-w-2xl text-lg text-muted">
                Learn to build with AI, share what you ship, and grow with people
                doing the same. Calm, readable body copy lets the headlines and accent
                talk.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs text-faint">
                Mono — JetBrains Mono (font-mono)
              </span>
              <p className="font-mono text-accent-soft">$ npx create-codu-app --ai</p>
            </div>
          </div>
        </Section>

        {/* ═══ COMPONENTS ═══ */}
        <Section n="03" title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <button className="primary-button">Primary — Join free</button>
            <button className="secondary-button">Secondary — Browse feed</button>
            <button className="font-mono text-sm font-semibold text-accent">
              Ghost ›
            </button>
          </div>
        </Section>

        <Section n="04" title="Form controls">
          <div className="grid max-w-xl gap-4">
            <label className="text-sm text-muted">
              Email
              <input
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-hairline bg-transparent px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
            </label>
            <label className="text-sm text-muted">
              What are you building?
              <textarea
                rows={3}
                placeholder="An AI changelog generator…"
                className="mt-1.5 w-full rounded-lg border border-hairline bg-transparent px-3.5 py-2.5 text-sm text-fg outline-none focus:border-accent"
              />
            </label>
          </div>
        </Section>

        <Section n="05" title="Tags & badges">
          <div className="flex flex-wrap gap-2">
            {["LLM", "agents", "RAG", "Next.js", "vibe-coding"].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
            <Tag variant="accent">Featured</Tag>
            <Tag variant="soft">AI-native</Tag>
          </div>
        </Section>

        <Section n="06" title="Card — job listing">
          <div className="rounded-xl border border-hairline bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-lg font-bold text-black">
                A
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold">
                    Founding AI Engineer
                  </h3>
                  <Tag variant="accent">Featured</Tag>
                </div>
                <p className="font-mono text-sm text-muted">Acme AI · Remote (EU)</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Full-time", "AI-native", "LLM", "agents"].map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ PATTERNS ═══ */}
        <Section n="07" title="Pattern — hero (editorial, no bento/blob)">
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-10 sm:p-16">
            <div
              aria-hidden
              className="absolute inset-0 bg-grid-dots bg-[length:22px_22px] opacity-50"
            />
            <div className="relative">
              <Eyebrow>the community for AI builders</Eyebrow>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
                Learn to build with AI. <span className="text-accent">Ship</span> what
                you make.
              </h2>
              <p className="mt-5 max-w-lg text-lg text-muted">
                Tutorials, a curated feed, and a community of indie hackers and AI
                builders doing the work.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button className="primary-button">Join free</button>
                <button className="font-mono text-sm font-semibold text-fg">
                  Browse the feed ›
                </button>
              </div>
            </div>
          </div>
        </Section>

        <footer className="border-t border-hairline pt-8 font-mono text-xs text-faint">
          /kitchen-sink · app/kitchen-sink/page.tsx · dev-only (NODE_ENV gate) · grow me
        </footer>
      </div>
    </div>
  );
}
