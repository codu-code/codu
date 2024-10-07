
import React from "react";
import { Course } from "./mock"; 

const CourseCard = ({ course }: { course: Course }) => {
  return (
    <div
      className={`rounded-lg p-6 shadow-md ${course.featured ? "bg-orange-100 dark:bg-orange-900" : "bg-gray-100 dark:bg-gray-800"}`}
    >
      {/* Course Title */}
      <h2 className="mb-4 text-2xl font-bold">{course.title}</h2>

      {/* Course Description */}
      <p className="mb-4 text-lg text-gray-700 dark:text-gray-300">
        {course.description}
      </p>

      {/* Course Progress */}
      <div className="flex items-center gap-4">
        <p className="text-lg">Progress:</p>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-lg font-bold">
          {course.progress}%
        </div>
      </div>

      {/* Start Course Button */}
      <button className="mt-4 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600">
        Start Course
      </button>
    </div>
  );
};

export default CourseCard;
