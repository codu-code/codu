import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "eu-west-1",
  // credentials: {
  //   accessKeyId: process.env.ACCESS_KEY || "",
  //   secretAccessKey: process.env.SECRET_KEY || "",
  // },
});

export const uploadFile = async (signedUrl: string, file: File) => {
  const response = await fetch(signedUrl, {
    body: file,
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
  });

  const fileLocation = response.url.split("?")[0];
  return { ...response, fileLocation };
};
