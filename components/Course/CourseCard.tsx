
import React from "react";
import { Course } from "./type"; 

interface CourseCardProps {
  course: Course;
  onStartCourse: (courseId: number) => void; // Change to number to match your mock data
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onStartCourse }) => {
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
      <button
        className="mt-4 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        onClick={() => onStartCourse(Number(course.id))} // Call the passed function with course ID
      >
        Start Course
      </button>
    </div>
  );
};

export default CourseCard;
