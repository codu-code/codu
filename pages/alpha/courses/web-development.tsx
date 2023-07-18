import Head from "next/head";
import Layout from "../../../components/Layout/Layout";
import {
  CourseContens,
  type IContent,
} from "../../../components/Course/CourseContents";
import { CircularProgressBar } from "../../../components/Course/CircularProgressBar";

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

      <Layout>
        <div className="mx-2">
          <div className="flex items-center justify-between max-w-5xl pb-4 mt-8 border-b sm:mx-auto lg:max-w-5xl sm:max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
              Introduction to Web Development
            </h1>
          </div>

          <div className="grid-cols-12 gap-8 mx-auto mt-8 lg:grid lg:max-w-5xl sm:max-w-2xl">
            <div className="relative md:col-span-7">
              <div className="max-w-5xl mb-8 sm:mx-auto lg:max-w-5xl sm:max-w-2xl">
                An introduction to web development designed to take you from
                your first steps in coding to building an interactive game.
              </div>
              {/* Course Contents */}
              <div className="space-y-6">
                <CourseContens title="Introduction" contents={contentsMock} />
                <CourseContens title="Intro to HTML" contents={contentsMock} />
              </div>
            </div>

            <section className="hidden col-span-5 lg:block">
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
                Your progress
              </h2>
              <div className="flex flex-col p-4 mt-10 bg-neutral-900">
                <p className="text-xl font-medium leading-none text-center">
                  Introduction to Web Development
                </p>
                <span className="self-center mt-4">
                  {/* Progress bar */}
                  <CircularProgressBar progress={48} />
                </span>
              </div>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default WebDevelopmentCourse;
