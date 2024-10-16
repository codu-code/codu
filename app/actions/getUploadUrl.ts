"use server";

import * as Sentry from "@sentry/nextjs";
import { getPresignedUrl } from "@/server/common/getPresignedUrl";
import { authActionClient } from "@/server/lib/safeAction";

import { z } from "zod";

const schema = z.object({
  type: z.string(),
  size: z.number(),
  uploadType: z.enum(["uploads", "user"]).default("uploads"),
});

export const getUploadUrl = authActionClient
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const { type, size, uploadType } = parsedInput;
    const extension = type.split("/")[1];
    const acceptedFormats = ["jpg", "jpeg", "gif", "png", "webp"];

    if (!acceptedFormats.includes(extension)) {
      throw new Error(
        `Invalid file. Accepted file formats: ${acceptedFormats.join(", ")}.`,
      );
    }

    if (size > 1048576 * 10) {
      throw new Error("Maximum file size 10mb");
    }

    try {
      const response = await getPresignedUrl(type, size, {
        kind: uploadType,
        userId: ctx.user.id,
      });

      return response;
    } catch (error) {
      Sentry.captureException(error);
      console.error("Error getting presigned URL:", error);
      throw new Error("Failed to upload image.");
    }
  });
