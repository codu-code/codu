"use client";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";
import { CircleCheck, SquarePlay } from "lucide-react";
import { type Session } from "next-auth";
import { notFound } from "next/navigation";
import { mockContentList } from "../../mock";

interface ContentProps {
  session: Session | null;
}

const Content = ({ session }: ContentProps) => {
  const flagEnabled = isFlagEnabled(FEATURE_FLAGS.COURSE_VIDEO);

  if (!flagEnabled) {
    notFound();
  }

  return (
    <div className="overflow-auto">
      <div className="w-full divide-x divide-gray-700 lg:grid lg:grid-cols-12">
        <VideoPlayer />
        <Sidebar contentList={mockContentList} />
      </div>
      <div className="mx-auto max-w-5xl">
        <ContentList contentList={mockContentList} />
      </div>
    </div>
  );
};

const VideoPlayer = () => (
  <div className="col-span-9">
    <div className="mx-auto w-full max-w-7xl bg-black">
      <iframe
        className="aspect-video w-full"
        src="https://www.youtube.com/embed/oKKG-CpDjrI"
        title="YouTube video"
      ></iframe>
    </div>
  </div>
);

interface SidebarProps {
  contentList: typeof mockContentList;
}

const Sidebar = ({ contentList }: SidebarProps) => (
  <div className="col-span-3 flex w-full flex-col overflow-auto">
    <ul className="divide-y divide-gray-700">
      {contentList && contentList.length > 0 ? (
        contentList.map((item, index) => (
          <SidebarItem key={index} item={item} />
        ))
      ) : (
        <li className="text-center text-gray-500">No content available</li>
      )}
    </ul>
  </div>
);

interface SidebarItemProps {
  item: (typeof mockContentList)[0];
}

const SidebarItem = ({ item }: SidebarItemProps) => (
  <li className="flex flex-row items-center justify-between px-2 py-2">
    <div className="flex flex-row items-center">
      <SquarePlay
        className="mr-4 h-5 w-5 text-white group-hover:text-white"
        aria-hidden="true"
      />
      <p>{item.title}</p>
    </div>
    <CircleCheck
      className={`h-6 w-6 ${
        item.watched ? "mr-2 h-5 w-5 text-pink-600" : "mr-2 h-5 w-5 text-white"
      }`}
      aria-hidden="true"
    />
  </li>
);

interface ContentListProps {
  contentList: typeof mockContentList;
}

const ContentList = ({ contentList }: ContentListProps) => {
  return (
    <>
      {contentList.map(
        ({
          id,
          title,
          longDescription,
          description,
          publishedDate,
          author,
          imageLink,
        }) => (
          <div key={id} className="mx-auto w-full max-w-7xl py-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
              {title}
            </h2>
            <li key={author} className="flex justify-between gap-x-6 py-5">
              <div className="flex min-w-0 gap-x-4">
                <img
                  alt=""
                  src={imageLink}
                  className="h-12 w-12 flex-none rounded-full bg-gray-50"
                />
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-neutral-800 dark:text-white">
                    {author}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                    {publishedDate}
                  </p>
                </div>
              </div>
            </li>
            <div>{description}</div>
            <div>{longDescription}</div>
          </div>
        ),
      )}
    </>
  );
};

export default Content;
