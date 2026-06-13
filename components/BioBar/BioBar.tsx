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
      <div className="flex flex-col border-t-2 border-hairline pt-6 sm:flex-row md:mx-auto">
        <Link href={`/${username}`} className="shrink-0">
          <img
            className="mb-2 mr-4 h-20 w-20 rounded-full bg-inset object-cover sm:mb-0 sm:h-24 sm:w-24"
            alt={`Avatar for ${name}`}
            src={image}
          />
        </Link>

        <div className="flex flex-col justify-center">
          {username && (
            <h4 className="text-lg font-bold text-fg md:text-xl">
              Written by{" "}
              <Link
                className="font-bold text-fg underline"
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
