import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../utils/s3helpers";
import { nanoid } from "nanoid";

interface UserFileConfig {
  kind: "user";
  userId: string;
}

interface EventFileConfig {
  kind: "events";
}

interface CommunityFileConfig {
  kind: "communities";
}

function getKey(
  config: UserFileConfig | CommunityFileConfig | EventFileConfig,
  extension: string
) {
  switch (config.kind) {
    case "user":
      return `u/${config.userId}.${extension}`;
    case "communities":
      return `c/${nanoid(16)}.${extension}`;
    case "events":
      return `e/${nanoid(16)}.${extension}`;
    default:
      throw new Error("Invalid folder provided");
  }
}

export const getPresignedUrl = async (
  fileType: string,
  fileSize: number,
  config: UserFileConfig | CommunityFileConfig | EventFileConfig
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

  const putUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 3600,
  });

  return putUrl;
};
