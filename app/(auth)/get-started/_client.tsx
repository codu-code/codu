"use client";

import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ds";

const GitHubIcon = () => (
  <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
      clipRule="evenodd"
    />
  </svg>
);

const GitLabIcon = () => (
  <svg viewBox="-.1 .5 960.1 923.7" className="h-5 w-5" aria-hidden="true" fill="currentColor">
    <path d="m958.9 442.4c1.1 26.1-2 52.1-9.2 77.2-7.1 25.1-18.3 48.8-33.1 70.3a240.43 240.43 0 0 1 -53.6 56.2l-.5.4-199.9 149.8-98.3 74.5-59.9 45.2c-3.5 2.7-7.4 4.7-11.5 6.1s-8.5 2.1-12.9 2.1c-4.3 0-8.7-.7-12.8-2.1s-8-3.4-11.5-6.1l-59.9-45.2-98.3-74.5-198.7-148.9-1.2-.8-.4-.4c-20.9-15.7-39-34.7-53.8-56.2s-26-45.3-33.2-70.4c-7.2-25.1-10.3-51.2-9.2-77.3 1.2-26.1 6.5-51.8 15.8-76.2l1.3-3.5 130.7-340.5q1-2.5 2.4-4.8 1.3-2.3 3.1-4.3 1.7-2.1 3.7-3.9 2-1.7 4.2-3.2c3.1-1.9 6.3-3.3 9.8-4.1 3.4-.9 7-1.3 10.5-1.1 3.6.2 7.1.9 10.4 2.2 3.3 1.2 6.5 3 9.3 5.2q2 1.7 3.9 3.6 1.8 2 3.2 4.3 1.5 2.2 2.6 4.7 1.1 2.4 1.8 5l88.1 269.7h356.6l88.1-269.7q.7-2.6 1.9-5 1.1-2.4 2.6-4.7 1.4-2.2 3.2-4.2 1.8-2 3.9-3.7c2.8-2.2 5.9-3.9 9.2-5.2 3.4-1.2 6.9-1.9 10.4-2.1 3.6-.2 7.1.1 10.6 1 3.4.9 6.7 2.3 9.7 4.2q2.3 1.4 4.3 3.2 2 1.7 3.7 3.8 1.7 2.1 3.1 4.4 1.3 2.3 2.3 4.8l130.5 340.6 1.3 3.5c9.3 24.3 14.6 50 15.7 76.1z" />
  </svg>
);

const oauthButton =
  "group inline-flex w-full items-center justify-center gap-3 rounded-lg border border-hairline bg-elevated px-4 py-3 text-sm font-semibold text-fg transition-all hover:-translate-y-0.5 hover:border-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// Email magic-link is gated: only render in dev, or when explicitly enabled.
const emailAuthEnabled =
  process.env.NEXT_PUBLIC_EMAIL_AUTH === "true" ||
  process.env.NODE_ENV !== "production";

const GetStarted: NextPage = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");
  const [userEmail, setUserEmail] = useState<string>("");
  const redirectTo =
    typeof callbackUrl === "string" ? callbackUrl : "/articles";

  // Capture a referral code (?ref=) so the referrer gets credited on signup.
  useEffect(() => {
    const ref = searchParams?.get("ref");
    if (ref) {
      document.cookie = `codu_ref=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
  }, [searchParams]);

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Brand panel — slim header on mobile, full panel on desktop */}
      <aside className="relative flex flex-col justify-between overflow-hidden border-b border-hairline bg-surface px-6 py-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-dots bg-[length:24px_24px] opacity-50 [mask-image:radial-gradient(90%_70%_at_20%_10%,black_30%,transparent_80%)]"
        />
        <Link
          href="/"
          aria-label="Codú home"
          className="relative inline-flex w-fit"
        >
          <Image
            src="/images/codu.png"
            alt="Codú"
            width={189}
            height={60}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <div className="relative mt-8 hidden lg:mt-0 lg:block">
          <Eyebrow>the community for AI builders</Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-fg xl:text-5xl">
            Learn to build with AI.
            <br />
            <span className="text-accent">Ship</span> what you make.
          </h1>
          <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-muted">
            Less theory, more shipping. Join the builders posting what they
            make.
          </p>
        </div>

        {/* spacer keeps logo top-aligned on desktop */}
        <div className="relative hidden lg:block" aria-hidden />
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12 lg:px-12 lg:py-16">
        <div className="w-full max-w-sm">
          <div className="text-center lg:text-left">
            <Eyebrow className="lg:hidden">join the community</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-fg lg:mt-0">
              Start building with AI
            </h2>
            <p className="mt-2 text-sm text-muted">
              Free forever. Create your account to read, write, save, and ship
              in public with other builders.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              data-testid="github-login-button"
              type="button"
              onClick={async () => {
                await signIn("github", { callbackUrl: redirectTo });
              }}
              className="primary-button w-full justify-center gap-3 py-3"
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
            <button
              data-testid="gitlab-login-button"
              type="button"
              onClick={async () => {
                await signIn("gitlab", { callbackUrl: redirectTo });
              }}
              className="secondary-button w-full justify-center gap-3 py-3"
            >
              <GitLabIcon />
              Continue with GitLab
            </button>

            {emailAuthEnabled && (
              <>
                <div className="relative py-1">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="w-full border-t border-hairline" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-canvas px-3 font-mono text-xs uppercase tracking-widest text-faint">
                      or
                    </span>
                  </div>
                </div>
                <input
                  className="w-full rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none transition-colors focus:border-accent"
                  placeholder="you@example.com"
                  type="email"
                  value={userEmail}
                  onChange={(event) => setUserEmail(event.target.value)}
                />
                <button
                  type="button"
                  disabled={!userEmail}
                  onClick={async () => {
                    await signIn("email", {
                      callbackUrl: redirectTo,
                      email: userEmail,
                    });
                  }}
                  className={`${oauthButton} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Continue with email
                </button>
              </>
            )}
          </div>

          <p className="mt-4 text-xs text-muted">More sign-in options coming soon.</p>

          <p className="mt-6 text-center text-xs text-faint lg:text-left">
            By continuing you agree to our{" "}
            <Link href="/tou" className="text-muted underline hover:text-fg">
              terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-muted underline hover:text-fg"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
};

export default GetStarted;
