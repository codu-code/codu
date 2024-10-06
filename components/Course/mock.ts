

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  featured: boolean;
}

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    description: `Discover the magic of web development in our beginner-friendly course!
                  Master HTML for structure, CSS for style, and JavaScript for interactivity.
                  Learn from experts, tackle hands-on projects, and build a strong foundation 
                  to create stunning, responsive websites.`,
    progress: 90,
    featured: true,
  },
  {
    id: '2',
    title: 'Advanced JavaScript Techniques',
    description: `Dive deeper into JavaScript and explore advanced concepts like closures, 
                  asynchronous programming, and design patterns. Enhance your problem-solving 
                  skills and write cleaner, more efficient code.`,
    progress: 60,
    featured: false,
  },
  {
    id: '3',
    title: 'React for Beginners',
    description: `Start your journey with React! This course covers the basics of React, 
                  including components, state, props, and hooks. Build interactive UIs 
                  with confidence and learn best practices from the ground up.`,
    progress: 75,
    featured: true,
  },
  {
    id: '4',
    title: 'Full-Stack Development with Node.js',
    description: `Become a full-stack developer by mastering back-end development with Node.js.
                  Learn how to build scalable web applications using Express.js, work with 
                  databases like MongoDB, and deploy your apps to the cloud.`,
    progress: 30,
    featured: false,
  },
  {
    id: '5',
    title: 'UI/UX Design Essentials',
    description: `Learn the fundamentals of user interface and user experience design. 
                  Understand color theory, typography, layout, and interaction design 
                  to create aesthetically pleasing and user-friendly interfaces.`,
    progress: 50,
    featured: false,
  },
  {
    id: '6',
    title: 'Machine Learning with Python',
    description: `Explore the world of Machine Learning using Python. This course covers 
                  data preprocessing, model building, and evaluation using popular libraries 
                  like NumPy, pandas, and scikit-learn.`,
    progress: 20,
    featured: false,
  },
  {
    id: '7',
    title: 'DevOps and Cloud Computing',
    description: `Understand the principles of DevOps and Cloud Computing. Learn about 
                  continuous integration/continuous deployment (CI/CD) pipelines, containerization 
                  with Docker, and cloud services like AWS, Azure, and Google Cloud.`,
    progress: 45,
    featured: true,
  },
  {
    id: '8',
    title: 'Data Structures and Algorithms',
    description: `Master the foundational concepts of computer science by learning data 
                  structures and algorithms. Tackle coding challenges and optimize your 
                  solutions to solve real-world problems efficiently.`,
    progress: 80,
    featured: true,
  },
  {
    id: '9',
    title: 'Cybersecurity Basics',
    description: `Gain an understanding of cybersecurity principles. Learn about network 
                  security, cryptography, threat detection, and mitigation techniques to 
                  secure systems and applications from malicious attacks.`,
    progress: 25,
    featured: false,
  },
];
