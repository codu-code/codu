
import React from "react";
import { mockCourses, userProgress } from "./mock"; 
import CourseCard from "./CourseCard";  
import { type Session } from "next-auth";

const CoursesLanding = ({ session }: { session: Session | null }) => {
  // Assuming feature flag is always enabled for simplicity
  const userLatestProgress = userProgress.coursesProgress[0];

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 dark:bg-gray-900 dark:text-white lg:px-16 lg:py-12">
      {/* Page Title */}
      <h1 className="mb-8 text-3xl font-bold lg:text-4xl">Courses</h1>

      {/* Layout with two columns on desktop */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left side: Courses */}
        <div className="lg:col-span-2">
          {mockCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* Right side: Advert & Latest Progress */}
        <div className="lg:col-span-1">
          {/* Featured Advert */}
          <div className="mb-8 rounded-lg bg-gray-100 p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">Featured Advert</h2>
            {/* Add an image or component for an ad here */}
            <div className="flex h-40 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
              Advert Content
            </div>
          </div>

          {/* Latest Progress */}
          <div className="rounded-lg bg-gray-100 p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">Latest Progress</h2>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <svg className="h-20 w-20">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-gray-300 dark:text-gray-600"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-pink-500"
                    strokeWidth="10"
                    fill="transparent"
                    style={{
                      strokeDasharray: "251",
                      strokeDashoffset: `calc(251 - (251 * ${userLatestProgress.progress}) / 100)`,
                    }}
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {userLatestProgress.courseTitle}
                </p>
                <p className="text-lg">
                  {userLatestProgress.progress}% Complete
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesLanding;
