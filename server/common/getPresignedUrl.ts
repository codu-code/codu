import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../utils/s3helpers";

export const getPresignedUrl = async (
  userId: string,
  fileType: string,
  fileSize: number,
) => {
  const extension = fileType.split("/")[1];
  if (!extension) throw new Error("Invalid file type provided");

  const Key = `u/${userId}.${extension}`;

  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key,
    ContentType: `image/${fileType}`,
    ContentLength: fileSize,
  });

  const putUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 3600,
  });

  return putUrl;
};
