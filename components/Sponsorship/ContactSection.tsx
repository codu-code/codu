import { ContactForm } from "./ContactForm";

export function ContactSection() {
  return (
    <section id="contact" className="bg-neutral-950 py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Let&apos;s Talk
          </h2>
          <p className="mt-4 text-neutral-400">
            Ready to reach our global developer community? Fill out the form and
            we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8">
          <ContactForm />
        </div>

        {/* Alternative contact */}
        <p className="mt-6 text-center text-sm text-neutral-500">
          Prefer email?{" "}
          <a
            href="mailto:partnerships@codu.co"
            className="text-orange-400 hover:underline"
          >
            partnerships@codu.co
          </a>
        </p>
      </div>
    </section>
  );
}
