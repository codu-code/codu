// @TODO remove head and add appropriate metadata

import Head from "next/head";
import CoursePreview from "@/components/Course/CoursePreview";

/**
 * Feel free to update this interface when the Course model
 * has been clearly defined in the Prisma schema.
 */
interface Course {
  name: string;
  description: string;
  thumbnail: string;
}

const Courses = () => {
  const courses = [
    {
      name: "Introduction to Web Development",
      description:
        "Discover the magic of web development in our beginner-friendly course! Master HTML for structure, CSS for style, and JavaScript for interactivity. Learn from experts, tackle hands-on projects, and build a strong foundation to create stunning, responsive websites. Unleash your creativity and join us today! <br /><br />Perfect for your first steps into a programming career or looking to refresh their fundamentals.",
      thumbnail:
        "https://images.unsplash.com/photo-1612758272676-dec3a658080e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    },
  ];

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-2">
        <div className="max-w-5xl sm:mx-auto mt-8 border-b pb-4 flex justify-between items-center lg:max-w-5xl sm:max-w-2xl">
          <h1 className="text-3xl tracking-tight font-extrabold text-neutral-50 sm:text-4xl ">
            Courses
          </h1>
        </div>

        <div className="max-w-5xl sm:mx-auto lg:max-w-5xl sm:max-w-2xl mt-4">
          {courses.map(({ name, description, thumbnail }) => (
            <CoursePreview
              key={name}
              name={name}
              description={description}
              thumbnail={thumbnail}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Courses;
