import Link from "next/link";

interface Props {
  author: {
    image: string;
    bio: string;
    name: string;
    username: string | null;
  };
}

const BioFooter = ({ author }: Props) => {
  if (!author) return null;

  const { name, image, bio, username } = author;
  return (
    <div className="mx-auto pb-4">
      <div className="flex flex-col sm:flex-row md:mx-auto border-t-2 pt-6 border-neutral-300 dark:border-neutral-800">
        <Link href={`/${username}`} className="shrink-0">
          <img
            className="mr-4 rounded-full object-cover bg-neutral-700 h-20 w-20 sm:h-24 sm:w-24 sm:mb-0 mb-2"
            alt={`Avatar for ${name}`}
            src={image}
          />
        </Link>

        <div className="flex flex-col justify-center">
          {username && (
            <h4 className="text-lg md:text-xl font-bold dark:text-neutral-200 neutral-900">
              Written by{" "}
              <Link
                className="underline font-bold dark:text-white neutral-900"
                href={`/${username}`}
              >
                {name}
              </Link>
            </h4>
          )}
          <p className="mt-1">{bio}</p>
        </div>
      </div>
    </div>
  );
};

export default BioFooter;
