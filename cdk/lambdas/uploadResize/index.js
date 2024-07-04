const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const s3 = new S3Client();

// Define the sizes
const sizes = [
  { maxWidth: 640, maxHeight: 640, suffix: "640w" },
  { maxWidth: 720, maxHeight: 720, suffix: "720w" },
  { maxWidth: 750, maxHeight: 750, suffix: "750w" },
  { maxWidth: 786, maxHeight: 786, suffix: "786w" },
  { maxWidth: 828, maxHeight: 828, suffix: "828w" },
  { maxWidth: 1100, maxHeight: 1100, suffix: "1100w" },
  { maxWidth: 1400, maxHeight: 1400, suffix: null }, // Original image override
];

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const response = await s3.send(new GetObjectCommand(params));
    const stream = response.Body;

    if (!stream) throw new Error("BodyStream is empty");

    const imageRaw = Buffer.concat(await stream.toArray());

    // Function to resize an image
    const resizeImage = async (buffer, size) => {
      return sharp(buffer)
        .resize({
          width: size.maxWidth,
          height: size.maxHeight,
          fit: "inside",
          withoutEnlargement: false,
        }) // Fits within maxWidth and maxHeight
        .webp({ quality: 80 })
        .toBuffer();
    };

    // Loop through sizes and upload each resized image
    for (const size of sizes) {
      const resizedImage = await resizeImage(imageRaw, size);

      const newKey = size.suffix
        ? `resized/${key.replace(/(\.[\w\d_-]+)$/i, `_${size.suffix}$1`)}`
        : `resized/${key}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: newKey,
          Body: resizedImage,
        }),
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Images resized successfully!" }),
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Error processing image");
  }
};
