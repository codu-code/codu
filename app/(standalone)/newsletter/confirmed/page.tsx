import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your email has been confirmed! Welcome to Codú Weekly.",
  robots: {
    follow: false,
    index: false,
  },
};

export default function NewsletterConfirmationPage() {
  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-black py-16 sm:flex sm:items-center sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl grid-cols-1 gap-x-8 gap-y-16">
          <div className="max-w-xl lg:max-w-lg">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              You email is confirmed!
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              {`Your email has been confirmed! Now you just have to wait for the next newsletter to arrive.`}
            </p>
          </div>
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
    </div>
  );
}
