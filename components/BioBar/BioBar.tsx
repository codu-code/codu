import Image from "next/image";
import { authors } from "../../config/site_settings";

const BioFooter = ({ userId = "" }) => {
  if (!authors[userId]) return null;

  const { name, imageUrl, bio, emoji } = authors[userId];
  return (
    <div className="max-w-xl px-4 mx-auto  text-gray-700 dark:text-gray-300 mt-6">
      <div className="flex mx-2 sm:mx-6 md:mx-auto px-4 border-t-2 pt-6 border-gray-300 dark:border-gray-800">
        <div className="mr-4 flex-shrink-0 self-center">
          <Image
            className="rounded-full"
            height={70}
            width={70}
            alt={`Avatar for ${name}`}
            src={imageUrl}
          />
        </div>
        <div className="flex flex-col justify-center">
          <h4 className="text-lg md:text-xl font-bold">
            Written by {name} • {emoji}
          </h4>
          <p className="mt-1">{bio}</p>
        </div>
      </div>
    </div>
  );
};

export default BioFooter;
