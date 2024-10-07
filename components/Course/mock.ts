

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  featured: boolean;
}


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
      "Master advanced JavaScript concepts, including closures, promises, async/await, and more.",
    progress: 65,
    featured: false,
  },
  {
    id: "3",
    title: "React for Beginners",
    description:
      "Get started with React, building modern web apps using components, hooks, and state management.",
    progress: 30,
    featured: false,
  },
  {
    id: "4",
    title: "Full-Stack Web Development",
    description:
      "Learn full-stack development with Node.js, Express, MongoDB, and React.",
    progress: 45,
    featured: true,
  },
  {
    id: "5",
    title: "Version Control with Git and GitHub",
    description:
      "Understand version control, Git, and how to collaborate on projects using GitHub.",
    progress: 80,
    featured: false,
  },
];

export const userProgress = {
  coursesProgress: [
    {
      courseTitle: 'Introduction to Web Development',
      progress: 90,
    },
    {
      courseTitle: 'Advanced JavaScript Concepts',
      progress: 65,
    },
    {
      courseTitle: 'React for Beginners',
      progress: 30,
    },
    {
      courseTitle: 'Full-Stack Web Development',
      progress: 45,
    },
    {
      courseTitle: 'Version Control with Git and GitHub',
      progress: 80,
    },
  ],
};
