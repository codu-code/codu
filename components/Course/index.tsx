
import React from "react";
import { mockCourses, userProgress } from "./mock";
import CourseCard from "./CourseCard";
import { type Session } from "next-auth";

const CoursesLanding = ({ session }: { session: Session | null }) => {
  const handleStartCourse = (courseId: number) => {
    console.log(`Starting course with ID: ${courseId}`);
    // Add logic here to navigate to the course content page or start the course
  };

  return (
    <div className="flex min-h-screen flex-col gap-8 px-4 py-8 dark:bg-gray-900 dark:text-white lg:px-16 lg:py-12">
      {/* Page Title */}
      <h1 className="mb-6 text-3xl font-bold lg:text-4xl">Courses</h1>

      {/* Courses List */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {mockCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onStartCourse={handleStartCourse}
          />
        ))}
      </div>
    </div>
  );
};

export default CoursesLanding;
