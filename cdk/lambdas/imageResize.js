import { S3 } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3({});

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const image = await s3.getObject(params);
    const bodyStream = image.Body;
    if (!bodyStream) throw new Error("BodyStream is empty");

    const resizedImage = await sharp(bodyStream)
      .resize({ width: 200, height: 200, fit: "fill" })
      .webp({ quality: 80 })
      .toBuffer();

    await s3.putObject({
      Bucket: bucket,
      Key: `resized/${key}`,
      Body: resizedImage,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Image resized successfully!" }),
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Error processing image");
  }
};
