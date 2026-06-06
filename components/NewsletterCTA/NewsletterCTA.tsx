interface NewsletterCTAProps {
  isSubscribed?: boolean;
}

const NewsletterCTA = ({ isSubscribed = false }: NewsletterCTAProps) => {
  return (
    <div className="mb-8 mt-2 overflow-hidden rounded-lg border border-neutral-300 bg-gradient-to-br from-blue-600 to-pink-600 text-white shadow-lg dark:border-neutral-600">
      <div className="p-6">
        <h3 className="mb-2 text-2xl font-bold">Build something every week</h3>
        <p className="mb-4 text-base opacity-95">
          Join builders getting weekly curated content: what&apos;s working in
          AI, plus top articles, tutorials, and tools from the community.
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          {["AI", "Tutorials", "Tools"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <svg
                className="h-3 w-3 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {item}
            </span>
          ))}
        </div>

        {isSubscribed ? (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-white/80 px-6 py-2.5 text-sm font-semibold text-pink-600"
          >
            <svg
              className="h-4 w-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Subscribed
          </button>
        ) : (
          <a
            href="https://newsletter.codu.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-pink-600 transition-all hover:bg-pink-50 hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
              <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
            </svg>
            Subscribe free
          </a>
        )}
      </div>
    </div>
  );
};

export default NewsletterCTA;
