import { SpeakerForm } from "@/components/Speaker/SpeakerForm";

export function SpeakersClient() {
  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <header className="mb-10">
          <p className="mb-4 inline-block rounded-full bg-gradient-to-r from-accent/20 to-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Speak at Codú
          </p>
          <h1 className="font-display text-3xl text-fg sm:text-4xl">
            Pitch a talk at a Codú meetup
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Codú runs regular meetups across Ireland and we&apos;re always
            looking for speakers. Whether it&apos;s your first talk or your
            fiftieth, we&apos;d love to hear your pitch. Propose a talk (or up
            to three) and we&apos;ll be in touch.
          </p>
        </header>

        <SpeakerForm />

        <p className="mt-6 text-center text-sm text-faint">
          Takes about 3 minutes. First-time speakers welcome — we&apos;ll help
          you prep.
        </p>
      </div>
    </div>
  );
}
