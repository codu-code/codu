const sharp = require("sharp");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
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

  // Check if the object is already a resized version
  if (sizes.some((size) => size.suffix && key.includes(`_${size.suffix}`))) {
    console.log("Object is already a resized version. Skipping.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Object is already resized. Skipping." }),
    };
  }

  try {
    // Check if the original image has already been processed
    const prefix = key.substring(0, key.lastIndexOf("."));
    const listParams = {
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1,
    };

    const listResponse = await s3.send(new ListObjectsV2Command(listParams));
    if (listResponse.Contents && listResponse.Contents.length > 1) {
      console.log("Image has already been processed. Skipping.");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Image already processed. Skipping." }),
      };
    }

    const params = {
      Bucket: bucket,
      Key: key,
    };

    const response = await s3.send(new GetObjectCommand(params));
    const stream = response.Body;

    if (!stream) throw new Error("BodyStream is empty");

    const imageRaw = Buffer.concat(await stream.toArray());

    // Determine the image format
    const imageMetadata = await sharp(imageRaw).metadata();
    const isGif = imageMetadata.format === "gif";

    // Function to resize an image
    const resizeImage = async (buffer, size) => {
      try {
        const resizedImage = sharp(buffer).resize({
          width: size.maxWidth,
          height: size.maxHeight,
          fit: "inside",
          withoutEnlargement: false,
        });

        if (isGif) {
          return resizedImage.gif().toBuffer();
        } else {
          return resizedImage.webp({ quality: 80 }).toBuffer();
        }
      } catch (error) {
        console.error(`Error resizing image to ${size.maxWidth}x${size.maxHeight}:`, error);
        throw error;
      }
    };

    // Loop through sizes and upload each resized image
    for (const size of sizes) {
      const resizedImage = await resizeImage(imageRaw, size);

      const resizedKey = size.suffix
        ? key.replace(
            /(\.[\w\d_-]+)$/i,
            `_${size.suffix}${isGif ? ".gif" : ".webp"}`,
          )
        : key;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: resizedKey,
          Body: resizedImage,
          ContentType: isGif ? "image/gif" : "image/webp",
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
