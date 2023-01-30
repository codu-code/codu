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
    <div className="max-w-xl mx-4 sm:mx-auto text-gray-700 dark:text-gray-300 mt-6">
      <div className="flex md:mx-auto border-t-2 pt-6 border-gray-300 dark:border-gray-800">
        <div className="shrink-0">
          <img
            className="mr-4 rounded-full object-cover bg-slate-700 h-24 w-25"
            alt={`Avatar for ${name}`}
            src={image}
          />
        </div>
        <div className="flex flex-col justify-center">
          {username && (
            <h4 className="text-lg md:text-xl font-semibold text-gray-200">
              Written by{" "}
              <Link
                className="underline font-semibold text-white"
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
