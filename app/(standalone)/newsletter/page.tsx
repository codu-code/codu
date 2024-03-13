import type { Metadata } from "next";
import { CalendarDaysIcon, HandRaisedIcon } from "@heroicons/react/24/outline";
import { SignupForm } from "./_form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Codú Weekly - The Newsletter for Web Developers",
  description:
    "The newsletter for Web Developers delivered weekly and 100% free. Get weekly articles delivered to your inbox.",
  keywords: [
    "programming",
    "frontend",
    "community",
    "learn",
    "programmer",
    "article",
    "Python",
    "JavaScript",
    "AWS",
    "HTML",
    "CSS",
    "Tailwind",
    "React",
    "email",
    "backend",
    "newsletter",
  ],
  metadataBase: new URL("https://www.codu.co"),
  openGraph: {
    images: "/images/og/newsletter.png",
  },
};

export default function NewsletterPage() {
  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-black py-16 sm:flex sm:items-center sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
          <div className="max-w-xl lg:max-w-lg">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Subscribe to Codú Weekly.
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              Join our free newsletter!{" "}
              <Link
                className="text-white underline"
                href="/letters/your-weekly-codu-fix-planetscale-alternatives-git-explained-and-more"
              >
                One newsletter
              </Link>{" "}
              per week with the latest articles, tips, and insights on web
              development. Don&apos;t miss out on valuable content delivered
              straight to your inbox!
            </p>
            <SignupForm />
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:pt-2">
            <div className="flex flex-col items-start">
              <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <CalendarDaysIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <dt className="mt-4 font-semibold text-white">
                Weekly newsletter
              </dt>
              <dd className="mt-2 leading-7 text-gray-400">
                Learn something new every Tuesday. We cover a wide range of
                topics in web development - frontend, backend, and full stack.
              </dd>
            </div>
            <div className="flex flex-col items-start">
              <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
                <HandRaisedIcon
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
              <dt className="mt-4 font-semibold text-white">No spam</dt>
              <dd className="mt-2 leading-7 text-gray-400">
                Just quality content. We respect your privacy. Unsubscribe at
                any time.
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div
        className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6"
        aria-hidden="true"
      >
        <div
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-orange-300 to-pink-500 opacity-30"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex justify-center p-8">
          <Link className="text-white underline" href="/privacy">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
