import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// S3 configuration interface
interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName?: string;
}

// S3 client instance
let s3Client: S3Client | null = null;

// Initialize S3 client
const initializeS3 = (): S3Client => {
  try {
    // Get environment variables
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'eu-north-1';

    // Validate required environment variables
    if (!accessKeyId) {
      throw new Error('AWS_ACCESS_KEY_ID is not defined in environment variables');
    }

    if (!secretAccessKey) {
      throw new Error('AWS_SECRET_ACCESS_KEY is not defined in environment variables');
    }

    console.log('🔄 Initializing AWS S3 client...');

    // Create S3 client configuration
    const s3Config: S3Config = {
      accessKeyId,
      secretAccessKey,
      region
    };

    // Initialize S3 client
    s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey
      }
    });

    console.log(`✅ AWS S3 client initialized successfully`);
    console.log(`📍 Region: ${region}`);

    return s3Client;

  } catch (error) {
    console.error('❌ Error initializing AWS S3 client:', error);
    throw error;
  }
};

// Get S3 client instance (singleton pattern)
const getS3Client = (): S3Client => {
  if (!s3Client) {
    return initializeS3();
  }
  return s3Client;
};

// Get bucket name from environment
const getBucketName = (): string => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
  }
  return bucketName;
};

// S3 configuration object for external use
const s3Config = {
  region: process.env.AWS_REGION || 'eu-north-1',
  bucketName: process.env.AWS_S3_BUCKET_NAME
};

export {
  initializeS3,
  getS3Client,
  getBucketName,
  s3Config
}; 