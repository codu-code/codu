"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useState } from "react";
import { api } from "@/server/trpc/react";

// New-member onboarding: interests → experience → focus. The picks tune the
// feed / left-rail "Your topics".

const ONB_TOPICS = [
  "AI patterns",
  "RAG",
  "Agents",
  "Prompting",
  "Evals",
  "LLM apps",
  "Product",
  "Design",
  "Frontend",
  "Backend",
  "Infra & DevOps",
  "Data",
  "Career",
  "Leadership",
  "Indie hacking",
  "Startups",
  "Marketing",
  "Open source",
];

const ONB_EXPERIENCE: [string, string, string][] = [
  ["new", "Just getting going", "New to building"],
  ["junior", "1–3 years", "Finding my feet"],
  ["mid", "4–8 years", "Comfortable shipping"],
  ["senior", "8+ years", "Been around the block"],
];

const ONB_FOCUS: [string, string, string][] = [
  ["ship", "Shipping products", "Get things out the door"],
  ["craft", "Sharpening my craft", "Go deeper, build better"],
  ["product", "Coder → product engineer", "Learn the why, not just the how"],
  ["business", "Building a business", "Turn what I build into a thing"],
  ["wave", "Riding the AI wave", "Keep up without the hype"],
];

const STEPS = 3;

function OnbChip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={clsx(
        "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
        on
          ? "border-accent bg-accent/10 text-accent-soft"
          : "border-hairline text-muted hover:border-strong hover:text-fg",
      )}
    >
      {on && <span className="mr-1.5 text-[11px]">✓</span>}
      {label}
    </button>
  );
}

function OnbCard({
  title,
  sub,
  on,
  onClick,
}: {
  title: string;
  sub: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={clsx(
        "flex items-start gap-3 rounded-xl border px-5 py-4 text-left transition-all",
        on
          ? "border-accent bg-accent/10"
          : "border-hairline bg-surface hover:border-strong",
      )}
    >
      <span
        className={clsx(
          "mt-0.5 inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border text-[11px] text-on-accent",
          on ? "border-accent bg-accent" : "border-strong bg-transparent",
        )}
      >
        {on ? "✓" : ""}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-lg font-bold leading-tight tracking-tight text-fg">
          {title}
        </span>
        <span className="text-sm leading-snug text-muted">{sub}</span>
      </span>
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
      <span className="text-faint">{"// "}</span>
      {children}
    </p>
  );
}

export default function Welcome() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [exp, setExp] = useState<string | null>(null);
  const [focus, setFocus] = useState<string[]>([]);

  const updateInterests = api.profile.updateInterests.useMutation();
  const saving = updateInterests.isPending;

  const toggle = (
    list: string[],
    set: Dispatch<SetStateAction<string[]>>,
    value: string,
  ) =>
    set(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value],
    );

  const canNext =
    step === 0
      ? interests.length >= 1
      : step === 1
        ? !!exp
        : step === 2
          ? focus.length >= 1
          : true;

  const finish = () => {
    if (saving) return;
    updateInterests.mutate(
      {
        topics: interests,
        experienceLevel: exp ?? undefined,
        markOnboarded: true,
      },
      {
        onSettled: () => router.push("/"),
      },
    );
  };

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else setStep(STEPS);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* chrome */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-12">
        <Image
          src="/images/codu.png"
          alt="Codú"
          width={189}
          height={60}
          className="h-[22px] w-auto"
          priority
        />
        {step < STEPS && (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="font-mono text-xs text-faint transition-colors hover:text-muted disabled:opacity-60"
          >
            Skip for now ›
          </button>
        )}
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-20 pt-6 sm:pt-12">
        <div className="w-full max-w-[640px]">
          {step < STEPS && (
            <div className="mb-10 flex gap-1.5">
              {Array.from({ length: STEPS }).map((_, i) => (
                <span
                  key={i}
                  className={clsx(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-accent" : "bg-hairline",
                  )}
                />
              ))}
            </div>
          )}

          {/* STEP 1 — interests */}
          {step === 0 && (
            <>
              <Eyebrow>step 1 of {STEPS}</Eyebrow>
              <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-4xl">
                What are you into?
              </h1>
              <p className="mb-6 mt-3 text-lg leading-relaxed text-muted">
                Pick a few topics and we&rsquo;ll tune your feed around them. You
                can change these anytime.
              </p>
              <div className="flex flex-wrap gap-2">
                {ONB_TOPICS.map((t) => (
                  <OnbChip
                    key={t}
                    label={t}
                    on={interests.includes(t)}
                    onClick={() => toggle(interests, setInterests, t)}
                  />
                ))}
              </div>
              <p
                className={clsx(
                  "mt-5 font-mono text-xs",
                  interests.length >= 3 ? "text-accent-soft" : "text-faint",
                )}
              >
                {interests.length === 0
                  ? "Pick at least one — 3 or more works best"
                  : `${interests.length} selected${
                      interests.length < 3
                        ? " · a few more makes it better"
                        : " · nice"
                    }`}
              </p>
            </>
          )}

          {/* STEP 2 — experience */}
          {step === 1 && (
            <>
              <Eyebrow>step 2 of {STEPS}</Eyebrow>
              <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-4xl">
                How long have you been building?
              </h1>
              <p className="mb-6 mt-3 text-lg leading-relaxed text-muted">
                So we pitch things at the right level — no gatekeeping either
                way.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ONB_EXPERIENCE.map(([id, title, sub]) => (
                  <OnbCard
                    key={id}
                    title={title}
                    sub={sub}
                    on={exp === id}
                    onClick={() => setExp(id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* STEP 3 — focus */}
          {step === 2 && (
            <>
              <Eyebrow>step 3 of {STEPS}</Eyebrow>
              <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-4xl">
                What are you here for?
              </h1>
              <p className="mb-6 mt-3 text-lg leading-relaxed text-muted">
                Pick whatever fits — we&rsquo;ll prioritise the stuff that
                matches.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ONB_FOCUS.map(([id, title, sub]) => (
                  <OnbCard
                    key={id}
                    title={title}
                    sub={sub}
                    on={focus.includes(id)}
                    onClick={() => toggle(focus, setFocus, id)}
                  />
                ))}
              </div>
            </>
          )}

          {/* DONE */}
          {step === STEPS && (
            <>
              <Eyebrow>all set</Eyebrow>
              <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-fg sm:text-5xl">
                Your feed&rsquo;s tuned.{" "}
                <span className="text-accent">Let&rsquo;s build.</span>
              </h1>
              <p className="mb-6 mt-3 text-lg leading-relaxed text-muted">
                We&rsquo;ll prioritise{" "}
                {interests.length ? (
                  <span className="text-fg">
                    {interests.slice(0, 3).join(", ")}
                    {interests.length > 3 ? ` +${interests.length - 3}` : ""}
                  </span>
                ) : (
                  "a broad mix"
                )}{" "}
                and tune as you read, save, and post.
              </p>
              {interests.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {interests.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs text-accent-soft"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-12 flex items-center justify-between gap-4">
            {step > 0 && step < STEPS ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="ghost-button text-sm"
              >
                ‹ Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS ? (
              <button
                type="button"
                className="primary-button px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canNext}
                onClick={next}
              >
                {step === STEPS - 1 ? "Finish" : "Continue"}
              </button>
            ) : (
              <button
                type="button"
                className="primary-button ml-auto px-6 py-3 text-base disabled:opacity-60"
                onClick={finish}
                disabled={saving}
              >
                Take me to my feed →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
