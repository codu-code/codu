import z from "zod";

export const AdditionalDetailsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Min name length is 2 characters.")
    .max(50, "Max name length is 30 characters."),
  surname: z
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
});

export const slideOneSchema = AdditionalDetailsSchema.pick({
  firstName: true,
  surname: true,
  username: true,
  location: true,
});

export const slideTwoSchema = AdditionalDetailsSchema.pick({
  dateOfBirth: true,
  gender: true,
});

export const slideThreeSchema = AdditionalDetailsSchema.pick({
  professionalOrStudent: true,
  workplace: true,
  jobTitle: true,
  levelOfStudy: true,
  course: true,
}).superRefine((val, ctx) => {
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

export type TypeAdditionalDetailsSchema = z.TypeOf<
  typeof AdditionalDetailsSchema
>;
