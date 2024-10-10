import z from "zod";

export const slideOneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Min name length is 2 characters.")
    .max(50, "Max name length is 50 characters."),
  username: z
    .string()
    .trim()
    .min(3, "Min username length is 3 characters.")
    .max(40, "Max username length is 40 characters.")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Username can only contain alphanumerics and dashes.",
    ),
  location: z.string().min(1, "Location is required"),
});

export const slideTwoSchema = z.object({
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string(),
});

export const slideThreeSchema = z
  .object({
    professionalOrStudent: z.string().min(1, "Select an option"),
    workplace: z.string().max(30, "Max length is 30 characters."),
    jobTitle: z.string().max(30, "Max length is 30 characters."),
    levelOfStudy: z.string(),
    course: z.string().max(30, "Max name length is 30 characters."),
    yearsOfExperience: z.enum(['0-1', '1-3', '3-5', '5-8', '8-12', '12+'], {
      invalid_type_error: "Select years of experience",
    }),
  })
  .superRefine((val, ctx) => {
    if (
      val.professionalOrStudent === "Current student" &&
      val.levelOfStudy === ""
    ) {
      ctx.addIssue({
        path: ["levelOfStudy"],
        code: "custom",
        message: "required",
      });
    }
    if (val.professionalOrStudent === "Current student" && val.course === "") {
      ctx.addIssue({
        path: ["course"],
        code: "custom",
        message: "required",
      });
    }
    if (
      val.professionalOrStudent === "Working professional" &&
      val.workplace === ""
    ) {
      ctx.addIssue({
        path: ["workplace"],
        code: "custom",
        message: "required",
      });
    }
    if (
      val.professionalOrStudent === "Working professional" &&
      val.jobTitle === ""
    ) {
      ctx.addIssue({
        path: ["jobTitle"],
        code: "custom",
        message: "required",
      });
    }
  });

export type TypeSlideOneSchema = z.TypeOf<typeof slideOneSchema>;

export type TypeSlideTwoSchema = z.TypeOf<typeof slideTwoSchema>;

export type TypeSlideThreeSchema = z.TypeOf<typeof slideThreeSchema>;
