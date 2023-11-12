import Image from "next/image";

interface Props {
  name: string;
  description: string;
  thumbnail: string;
}

const CoursePreview = ({ name, description, thumbnail }: Props) => {
  return (
    <div className="flex flex-col bg-neutral-800 md:flex-row">
      {/**
       * `relative` and `overflow-hidden` are required for Image's `fill` to work
       * @see https://nextjs.org/docs/pages/api-reference/components/image#fill
       */}
      <div className="relative order-1 aspect-video flex-shrink-0 overflow-hidden md:order-2 md:w-64 lg:w-96">
        <Image alt={name} src={thumbnail} fill className="object-cover" />
      </div>
      <div className="order-2 md:order-1">
        <h2 className="border-b border-neutral-500 px-3 py-2 text-lg font-bold lg:px-6 lg:py-1">
          {name}
        </h2>
        <div
          className="px-3 py-3 lg:px-6"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>
    </div>
  );
};

export default CoursePreview;
