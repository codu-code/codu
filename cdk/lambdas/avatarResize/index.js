const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const s3 = new S3Client();

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  try {
    // Check if the image has already been resized
    const headParams = {
      Bucket: bucket,
      Key: key,
    };

    const headResponse = await s3.send(new HeadObjectCommand(headParams));
    const s3Metadata = headResponse.Metadata || {};
    const contentType = headResponse.ContentType;

    if (s3Metadata.resized === "true") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Image already resized. Skipping." }),
      };
    }

    // Get the original image
    const getParams = {
      Bucket: bucket,
      Key: key,
    };

    const response = await s3.send(new GetObjectCommand(getParams));
    const stream = response.Body;

    if (!stream) throw new Error("BodyStream is empty");

    const imageBuffer = Buffer.concat(await stream.toArray());

    // Resize the image
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 220, height: 220, fit: "cover" })
      .toBuffer();

    // Put the resized image back in the same place
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: resizedImageBuffer,
        Metadata: { ...s3Metadata, resized: "true" },
        ContentType: contentType,
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Image resized successfully!" }),
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Error processing image");
  }
};
