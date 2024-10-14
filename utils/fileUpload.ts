import { toast } from "sonner";
import { uploadFile } from "./s3helpers";

type UploadToUrlProps = {
  signedUrl: string;
  file: File;
  updateUserPhotoUrl: (params: {
    url: string;
  }) => Promise<{ role: string; id: string; name: string }>;
};

type UploadResult = {
  status: "success" | "error" | "loading";
  fileLocation: string | null;
};

export const uploadToUrl = async ({
  signedUrl,
  file,
  updateUserPhotoUrl,
}: UploadToUrlProps): Promise<UploadResult> => {
  if (!file) {
    toast.error("Invalid file upload.");
    return { status: "error", fileLocation: null };
  }

  try {
    const response = await uploadFile(signedUrl, file);
    const { fileLocation } = response;

    await updateUserPhotoUrl({ url: fileLocation });
    toast.success("Profile photo successfully updated.");

    return { status: "success", fileLocation };
  } catch (error) {
    toast.error("Failed to upload profile photo. Please try again.");
    return { status: "error", fileLocation: null };
  }
};
