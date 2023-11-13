// @TODO add appropriate metadata

import CoursePreview from "@/components/Course/CoursePreview";

/**
 * Feel free to update this interface when the Course model
 * has been clearly defined in the Prisma schema.
 */

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
      <div className="mx-2">
        <div className="mt-8 flex max-w-5xl items-center justify-between border-b pb-4 sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-50 sm:text-4xl ">
            Courses
          </h1>
        </div>

        <div className="mt-4 max-w-5xl sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
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
