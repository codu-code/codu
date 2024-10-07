import { Course } from "./type";

// Define the UserProgress type
type UserProgress = {
  coursesProgress: Array<{
    courseId: number; // Use string for the ID
    progress: number; // Progress percentage
    featured: boolean; // Include the featured status if needed
  }>;
};

// Mock courses data
export const mockCourses: Course[] = [
  {
    id: 1, // Changed to string
    title: 'Introduction to Web Development',
    description: 'Learn the basics of HTML, CSS, and JavaScript to build responsive websites.',
    progress: 90,
    featured: true,
  },
  {
    id: 2,
    title: 'Advanced JavaScript Concepts',
    description: 'Deep dive into JavaScript with a focus on ES6+ features and asynchronous programming.',
    progress: 65,
    featured: false,
  },
  {
    id: 3,
    title: 'React for Beginners',
    description: 'Understand the fundamentals of React and how to build interactive UIs.',
    progress: 30,
    featured: true,
  },
  {
    id: 4,
    title: 'Full-Stack Web Development',
    description: 'Learn to build full-stack applications using modern technologies like Node.js and Express.',
    progress: 45,
    featured: false,
  },
  {
    id: 5,
    title: 'Version Control with Git and GitHub',
    description: 'Master version control using Git and learn how to collaborate on GitHub.',
    progress: 80,
    featured: true,
  },
];

// Function to generate user progress
export const generateUserProgress = (courses: Course[]): UserProgress => ({
  coursesProgress: courses.map(course => ({
    courseId: course.id, // Use the course ID
    progress: course.progress, // Use the course progress
    featured: course.featured, // Include featured status if needed
  })),
});

// Generate the user progress based on mockCourses
export const userProgress: UserProgress = generateUserProgress(mockCourses);