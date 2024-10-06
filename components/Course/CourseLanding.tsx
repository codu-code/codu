import { mockCourses } from "./mock"; 
import { type Session } from "next-auth";

const CoursesLanding = ({ session }: { session: Session | null }) => {
  return (
    <div className="flex min-h-screen flex-col gap-8 px-4 py-8 dark:bg-gray-900 dark:text-white lg:px-16 lg:py-12">
      {/* Page Title */}
      <h1 className="mb-6 text-3xl font-bold lg:text-4xl">Courses</h1>

      {/* Courses List */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {mockCourses.map((course) => (
          <div
            key={course.id}
            className={`rounded-lg p-6 shadow-md ${
              course.featured
                ? "bg-orange-100 dark:bg-orange-900"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {/* Course Title */}
            <h2 className="mb-4 text-2xl font-bold lg:text-3xl">
              {course.title}
            </h2>

            {/* Course Description */}
            <p className="mb-4 text-lg text-gray-700 dark:text-gray-300 lg:text-xl">
              {course.description}
            </p>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <p className="text-lg lg:text-xl">Progress:</p>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-lg font-bold">
                {course.progress}%
              </div>
            </div>

            {/* Start Course Button */}
            <button className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600">
              Start Course
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesLanding;
