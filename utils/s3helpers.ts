import { S3Client } from "@aws-sdk/client-s3";

// Trim: stray whitespace in the key env vars otherwise breaks SigV4 signing.
const accessKeyId = process.env.ACCESS_KEY?.trim();
const secretAccessKey = process.env.SECRET_KEY?.trim();
const hasAccessKeys = accessKeyId && secretAccessKey;

export const s3Client = new S3Client({
  region: "eu-west-1",
  ...(hasAccessKeys
    ? {
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }
    : {}),
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
  // Pull fields off explicitly — spreading a Response drops its prototype
  // getters (ok/status), leaving callers to read `undefined` for `ok`.
  return { ok: response.ok, status: response.status, fileLocation };
};
