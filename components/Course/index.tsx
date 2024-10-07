
import React from "react";
import { useRouter } from "next/router";
import { mockCourses } from "./mock"; 
import CourseCard from "./CourseCard";
import { type Session } from "next-auth";

const CoursesLanding = ({ session }: { session: Session | null }) => {
  const router = useRouter(); // Initialize the useRouter hook

  const handleStartCourse = (courseId: number) => {
    // Navigate to the course content page
    router.push(`/courses/${courseId}`);
    
  };

  return (
    <div className="flex min-h-screen flex-col gap-8 px-4 py-8 dark:bg-gray-900 dark:text-white lg:px-16 lg:py-12">
      {/* Page Title */}
      <h1 className="mb-6 text-3xl font-bold lg:text-4xl">Courses</h1>

      {/* Courses List with aria-label for accessibility */}
      <div
        className="grid grid-cols-1 gap-8 lg:grid-cols-2"
        aria-label="List of available courses"
      >
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
