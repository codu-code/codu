import z from "zod";

// Tried with enums/tuple but would have had to define an enum in prisma?

export const DeveloperDetailsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Min name length is 2 characters.")
      .max(50, "Max name length is 30 characters."),
    username: z
      .string()
      .trim()
      .min(3, "Min name length is 2 characters.")
      .max(40, "Max name length is 30 characters."),

    location: z.string().min(1, "Location is required"),
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z.date(),
    professionalOrStudent: z.string().min(1, "Select an option"),

    workplace: z.string().max(30, "Max length is 30 characters."),
    jobTitle: z.string().max(30, "Max length is 30 characters."),
    levelOfStudy: z.string(),
    course: z.string().max(30, "Max name length is 30 characters."),
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

export type TypeDeveloperDetailsSchema = z.TypeOf<
  typeof DeveloperDetailsSchema
>;

export type TypeDeveloperDetailsWithNullDateOfBirth = Omit<
  TypeDeveloperDetailsSchema,
  "dateOfBirth"
> & { dateOfBirth: Date | null };
