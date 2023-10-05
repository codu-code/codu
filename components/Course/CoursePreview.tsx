import Image from "next/image";

interface Props {
  name: string;
  description: string;
  thumbnail: string;
}

const CoursePreview = ({ name, description, thumbnail }: Props) => {
  return (
    <div className="bg-neutral-800 flex flex-col md:flex-row">
      {/**
       * `relative` and `overflow-hidden` are required for Image's `fill` to work
       * @see https://nextjs.org/docs/pages/api-reference/components/image#fill
       */}
      <div className="order-1 md:order-2 relative overflow-hidden flex-shrink-0 aspect-video md:w-64 lg:w-96">
        <Image alt={name} src={thumbnail} fill className="object-cover" />
      </div>
      <div className="order-2 md:order-1">
        <h2 className="font-bold text-lg px-3 py-2 lg:px-6 lg:py-1 border-neutral-500 border-b">
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
