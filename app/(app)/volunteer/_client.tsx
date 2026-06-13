import { VolunteerForm } from "@/components/Volunteer/VolunteerForm";

export function VolunteerClient() {
  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <header className="mb-10">
          <p className="mb-4 inline-block rounded-full bg-gradient-to-r from-accent/20 to-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Volunteer with Codú
          </p>
          <h1 className="font-display text-3xl text-fg sm:text-4xl">
            Help us build Ireland&apos;s largest web dev community
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Codú is Ireland&apos;s largest web dev community — thousands of
            developers, regular meetups, and a newsletter across the Irish tech
            ecosystem. We&apos;re opening volunteer spots for people interested
            in marketing and events.
          </p>
        </header>

        <VolunteerForm />

        <p className="mt-6 text-center text-sm text-faint">
          Takes about 3 minutes. We read every application and reply within 2
          weeks.
        </p>
      </div>
    </div>
  );
}
