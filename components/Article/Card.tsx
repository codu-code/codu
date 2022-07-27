import type { NextPage } from "next";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  slug: string
};

const Card: NextPage<Props> = ({ title, description, slug }) => {
  return (
    <Link href={`/articles/${slug}`}>
      <article>
        <h2 className="my-6 sm:my-3 pt-5 text-2xl sm:text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase cursor-pointer">{title}</h2>
        <p className="tracking-wide text-sm md:text-base">{description}</p>
      </article>
    </Link>
  );
};

export default Card;
