import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_S3_BUCKET || "";

export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `resumes/${Date.now()}-${fileName}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    return key;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

export async function getFileFromS3(key: string): Promise<Buffer> {
  const getParams = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const response = await s3Client.send(new GetObjectCommand(getParams));

    if (!response.Body) {
      throw new Error("No file content received from S3");
    }

    // Convert the readable stream to a buffer
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  } catch (error) {
    console.error("Error getting file from S3:", error);
    throw new Error("Failed to get file from S3");
  }
}

export async function deleteFileFromS3(key: string): Promise<void> {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
}

export async function generatePresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate presigned URL");
  }
}
