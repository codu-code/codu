import { getUploadUrl } from "@/app/actions/getUploadUrl";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { uploadCompanyLogoUrlSchema } from "@/schema/job";
import { TRPCError } from "@trpc/server";
import { getPresignedUrl } from "@/server/common/getPresignedUrl";

export const jobsRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(uploadCompanyLogoUrlSchema)
    .mutation(async ({ ctx, input }) => {
      const { size, type } = input;
      const extension = type.split("/")[1];

      const acceptedFormats = ["jpg", "jpeg", "gif", "png", "webp"];

      if (!acceptedFormats.includes(extension)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid file. Accepted file formats: ${acceptedFormats.join(", ")}.`,
        });
      }

      if (size > 1048576) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum file size 1MB",
        });
      }

      const response = await getPresignedUrl(type, size, {
        kind: "companyLogo",
        userId: ctx.session.user.id,
      });

      return response;
    }),
});
