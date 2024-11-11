// Mock video source (this would typically be a path to a video file)
const mockVideoSrc = "https://youtu.be/Ln4KSN0rchI?t=12";

// Mock content list
const mockContentList = [
  {
    id: 1,
    title: "Introduction to React",
    longDescription:
      "In this video, we will explore the fundamentals of React, including its component-based architecture, virtual DOM, and how to get started with your first React application. This tutorial guides you through the installation and configuration of essential tools like Node.js, npm, and create-react-app to set up your React development environment.",
    description: "Learn the basics of React and its core concepts",
    watched: false,
    publishedDate: "2023-01-15",
    author: "John Doe",
    imageLink: "https://example.com/images/react-introduction.jpg",
  },
  {
    id: 2,
    title: "Setting Up Your Development Environment",
    longDescription:
      "This tutorial guides you through the installation and configuration of essential tools like Node.js, npm, and create-react-app to set up your React development environment.",
    description:
      "Install and configure the necessary tools for React development",
    watched: true,
    publishedDate: "2023-01-22",
    author: "Jane Smith",
  },
  {
    id: 3,
    title: "Components and Props",
    longDescription:
      "Dive deep into React's core concepts of components and props. Learn how to create reusable components and pass data between them using props.",
    description: "Understand the building blocks of React applications",
    watched: true,
    publishedDate: "2023-01-29",
    author: "John Doe",
  },
  {
    id: 4,
    title: "State and Lifecycle",
    longDescription:
      "Explore how to manage component state and lifecycle methods to build dynamic and interactive applications with React.",
    description: "Manage component state and lifecycle methods",
    watched: true,
    publishedDate: "2023-02-05",
    author: "Jane Smith",
  },
  {
    id: 5,
    title: "Handling Events",
    longDescription:
      "Learn how to handle user interactions in React, including events like clicks, form submissions, and more.",
    description: "Learn how to handle user interactions in React",
    watched: true,
    publishedDate: "2023-02-12",
    author: "John Doe",
  },
  {
    id: 6,
    title: "Conditional Rendering",
    longDescription:
      "Discover how to display different UI elements based on specific conditions in your React applications.",
    description: "Display different UI based on conditions",
    watched: false,
    publishedDate: "2023-02-19",
    author: "Jane Smith",
  },
  {
    id: 7,
    title: "Lists and Keys",
    longDescription:
      "Learn the best practices for rendering lists of components in React and how to efficiently manage them with unique keys.",
    description: "Render multiple components efficiently",
    watched: false,
    publishedDate: "2023-02-26",
    author: "John Doe",
  },
  {
    id: 8,
    title: "Forms in React",
    longDescription:
      "This video covers how to create and manage forms in React applications, including controlled and uncontrolled components.",
    description: "Create and handle form inputs in React applications",
    watched: false,
    publishedDate: "2023-03-05",
    author: "Jane Smith",
  },
  {
    id: 9,
    title: "Hooks: useState and useEffect",
    longDescription:
      "An introduction to React Hooks, focusing on useState and useEffect to manage state and side effects in functional components.",
    description: "Understand and use basic React Hooks",
    watched: false,
    publishedDate: "2023-03-12",
    author: "John Doe",
  },
  {
    id: 10,
    title: "Custom Hooks",
    longDescription:
      "Learn how to create custom hooks in React to encapsulate and reuse logic across components.",
    description: "Create reusable logic with custom Hooks",
    watched: false,
    publishedDate: "2023-03-19",
    author: "Jane Smith",
  },
  {
    id: 11,
    title: "Context API",
    longDescription:
      "Explore the Context API to manage global state in your React applications without the need for prop drilling.",
    description: "Manage global state in your React application",
    watched: false,
    publishedDate: "2023-03-26",
    author: "John Doe",
  },
  {
    id: 12,
    title: "React Router",
    longDescription:
      "Learn how to implement navigation in your single-page applications using React Router, including dynamic routing and nested routes.",
    description: "Implement navigation in your single-page application",
    watched: false,
    publishedDate: "2023-04-02",
    author: "Jane Smith",
  },
];

export { mockVideoSrc, mockContentList };
