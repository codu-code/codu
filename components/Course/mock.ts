import { Course } from "./type";

export const mockCourses: Course[] = [
  {
    id: "1", 
    title: "Introduction to Web Development",
    description:
      "Learn the basics of HTML, CSS, and JavaScript to build responsive websites.",
    progress: 90,
    featured: true, 
  },
  {
    id: "2", 
    title: "Advanced JavaScript Concepts",
    description:
      "Deep dive into JavaScript with advanced concepts and techniques.",
    progress: 65,
    featured: false, 
  },
  {
    id: "3", 
    title: "React for Beginners",
    description: "Get started with React and build interactive UIs.",
    progress: 30,
    featured: false, 
  },
  {
    id: "4", 
    title: "Full-Stack Web Development",
    description:
      "Become a full-stack developer by learning both front-end and back-end technologies.",
    progress: 45,
    featured: true, 
  },
  {
    id: "5", 
    title: "Version Control with Git and GitHub",
    description:
      "Learn how to use Git for version control and GitHub for collaboration.",
    progress: 80,
    featured: false, 
  },
];

// Function to generate user progress from courses
export const generateUserProgress = (courses: Course[]) => ({
  coursesProgress: courses.map((course) => ({
    courseId: course.id, 
    progress: course.progress,
    featured: course.featured, 
  })),
});

export const userProgress = generateUserProgress(mockCourses);