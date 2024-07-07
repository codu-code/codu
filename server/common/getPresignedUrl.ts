import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../utils/s3helpers";
import { nanoid } from "nanoid";

function getKey(
  config: {
    kind: string;
    userId?: string;
  },
  extension: string,
) {
  switch (config.kind) {
    case "user":
      if (!config.userId) throw new Error("Invalid userId provided");
      return `u/${config.userId}.${extension}`;
    case "communities":
      return `c/${nanoid(16)}.${extension}`;
    case "events":
      return `e/${nanoid(16)}.${extension}`;
    case "uploads":
      if (!config.userId) throw new Error("Invalid userId provided");
      return `public/${config.userId}/${nanoid(16)}.${extension}`;
    default:
      throw new Error("Invalid folder provided");
  }
}

export const getPresignedUrl = async (
  fileType: string,
  fileSize: number,
  config: {
    kind: string;
    userId?: string;
  },
) => {
  const extension = fileType.split("/")[1];
  if (!extension) throw new Error("Invalid file type provided");

  const Key = getKey(config, extension);

  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key,
    ContentType: `image/${fileType}`,
    ContentLength: fileSize,
  });

  // @FIX TS ERROR
  const putUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 3600,
  });

  return putUrl;
};
