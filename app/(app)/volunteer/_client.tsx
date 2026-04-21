import { VolunteerForm } from "@/components/Volunteer/VolunteerForm";

export function VolunteerClient() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <header className="mb-10">
          <p className="mb-4 inline-block rounded-full bg-gradient-to-r from-orange-400/20 to-pink-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-300">
            Volunteer with Codú
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Help us build Ireland&apos;s largest web dev community
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral-300">
            Codú is Ireland&apos;s largest web dev community — thousands of
            developers, regular meetups, and a newsletter across the Irish tech
            ecosystem. We&apos;re opening volunteer spots for people interested
            in marketing and events.
          </p>
        </header>

        <VolunteerForm />

        <p className="mt-6 text-center text-sm text-neutral-400">
          Takes about 3 minutes. We read every application and reply within 2
          weeks.
        </p>
      </div>
    </div>
  );
}
