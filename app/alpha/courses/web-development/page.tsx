// @TODO remove head and add appropriate metadata

import Head from "next/head";

import {
  CourseContens,
  type IContent,
} from "@/components/Course/CourseContents";
import { CircularProgressBar } from "@/components/Course/CircularProgressBar";

// ! This is hardcoded and needs to be dynamic
// ! I assume the route also should like [course-name].tsx , not web-development.tsx. Keep in mind it is hardcoded for now!

const contentsMock: IContent[] = [
  { title: "How to use this site", completed: true },
  { title: "About this course" },
  { title: "Getting help" },
  { title: "Join the community" },
];

const WebDevelopmentCourse = () => {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-2">
        <div className="mt-8 flex max-w-5xl items-center justify-between border-b pb-4 sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
            Introduction to Web Development
          </h1>
        </div>

        <div className="mx-auto mt-8 grid-cols-12 gap-8 sm:max-w-2xl lg:grid lg:max-w-5xl">
          <div className="relative md:col-span-7">
            <div className="mb-8 max-w-5xl sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
              An introduction to web development designed to take you from your
              first steps in coding to building an interactive game.
            </div>
            {/* Course Contents */}
            <div className="space-y-6">
              <CourseContens title="Introduction" contents={contentsMock} />
              <CourseContens title="Intro to HTML" contents={contentsMock} />
            </div>
          </div>

          <section className="col-span-5 hidden lg:block">
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
              Your progress
            </h2>
            <div className="mt-10 flex flex-col bg-neutral-900 p-4">
              <p className="text-center text-xl font-medium leading-none">
                Introduction to Web Development
              </p>
              <span className="mt-4 self-center">
                {/* Progress bar */}
                <CircularProgressBar progress={48} />
              </span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default WebDevelopmentCourse;
