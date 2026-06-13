import { notFound } from "next/navigation";
import Link from "next/link";
import { companies } from "./config";

export const metadata = {
  title: "Ninedots Recruitment | Codú",
  description:
    "Explore our community sponsors. Ninedots Recruitment connects top talent with leading companies in the tech industry.",
};

type Props = { params: Promise<{ slug: string }> };

export default async function Page(props: Props) {
  const params = await props.params;
  const { slug } = params;

  const company = companies.find((item) => item.slug === slug.toLowerCase());

  if (!company) return notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-neutral-800">
        <div className="border-b border-neutral-200 p-6 dark:border-neutral-700">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md bg-neutral-700 p-2">
              <img
                src={company.image}
                alt={`${company.name} logo`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {company.name}
              </h1>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                {company.bio}
              </p>

              {company.url && (
                <a
                  href={company.url}
                  className="mt-4 inline-flex items-center text-sm font-medium text-accent hover:text-accent dark:text-accent dark:hover:text-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit website
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <Link
            href="/sponsorship"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            ← Back to all sponsors
          </Link>
        </div>
      </div>
    </div>
  );
}
