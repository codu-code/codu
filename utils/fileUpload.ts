import { toast } from "sonner";
import { uploadFile } from "./s3helpers";

type UploadToUrlProps = {
  file: File;
  getUploadUrl: (data: { size: number; type: string }) => Promise<string>;
  updateUserPhotoUrl: (data: {
    url: string;
  }) => Promise<{ role: string; id: string; name: string }>;
};

type UploadResult = {
  status: "success" | "error" | "loading";
  fileLocation: string;
};

export const imageUploadToUrl = async ({
  file,
  updateUserPhotoUrl,
  getUploadUrl,
}: UploadToUrlProps): Promise<UploadResult> => {
  if (!file) {
    toast.error("Invalid file upload.");
    return { status: "error", fileLocation: "" };
  }

  try {
    const { size, type } = file;
    const signedUrl = await getUploadUrl({ size, type });

    if (!signedUrl) {
      toast.error("Failed to upload profile photo. Please try again.");
      return { status: "error", fileLocation: "" };
    }

    const response = await uploadFile(signedUrl, file);

    const { fileLocation } = response;

    if (!fileLocation) {
      toast.error("Failed to retrieve file location after upload.");
      return { status: "error", fileLocation: "" };
    }
    await updateUserPhotoUrl({ url: fileLocation });
    toast.success("Profile photo successfully updated.");

    return { status: "success", fileLocation };
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Failed to upload profile photo. Please try again.");
    }
    return { status: "error", fileLocation: "" };
  }
};
