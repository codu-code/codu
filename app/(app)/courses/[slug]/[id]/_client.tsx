"use client";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";
import { CheckCircle, CircleCheck, PlayCircle, SquarePlay } from "lucide-react";
import { type Session } from "next-auth";
import { notFound } from "next/navigation";
import { mockContentList, mockVideoSrc } from "../../mock";

const Content = ({ session }: { session: Session | null }) => {
  const flagEnabled = isFlagEnabled(FEATURE_FLAGS.COURSE_VIDEO);

  if (!flagEnabled) {
    notFound();
  }

  return (
    <div className="flex w-full flex-grow flex-col">
      <div className="w-full divide-x divide-gray-700 lg:grid lg:grid-cols-12">
        {/* Video container */}
        <div className="col-span-9">
          <div className="bg-black">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/Q68wOyeG5lc"
              title="YouTube video"
            ></iframe>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 flex w-full flex-col overflow-auto">
          <ul className="divide-y divide-gray-700">
            {mockContentList && mockContentList.length > 0 ? (
              mockContentList.map((item, index) => (
                <li
                  key={index}
                  className="flex flex-row items-center justify-between px-2  py-2 "
                >
                  <div className="flex flex-row items-center">
                    <SquarePlay
                      className="mr-4 h-5 w-5 text-white group-hover:text-white"
                      aria-hidden="true"
                    />
                    <p>{item.title}</p>
                  </div>
                  <CircleCheck
                    className={
                      item.watched
                        ? "mr-2 h-5 w-5 text-pink-600"
                        : "mr-2 h-5 w-5 text-white"
                    }
                    aria-hidden="true"
                  />
                </li>
              ))
            ) : (
              <li className="text-center text-gray-500">
                No content available
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="flex-none">
        <div>Video title</div>
        <div>descritpion</div>
      </div>
    </div>
  );
};

export default Content;
