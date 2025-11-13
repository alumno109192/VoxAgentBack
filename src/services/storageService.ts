import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

class StorageService {
  private s3Client: S3Client | undefined;

  constructor() {
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      this.s3Client = new S3Client({
        region: config.aws.s3Region,
        credentials: {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        },
      });
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      if (!this.s3Client) {
        return await this.saveLocally(fileBuffer, fileName);
      }

      const key = `recordings/${Date.now()}-${uuidv4()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      return key;
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for download
   */
  async getPresignedUrl(key: string): Promise<string> {
    try {
      if (!this.s3Client) {
        return key; // Return local path if S3 not configured
      }

      const command = new GetObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: config.aws.presignedUrlExpires,
      });

      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  /**
   * Upload from URL (e.g., Bland recording URL)
   */
  async uploadFromUrl(url: string, fileName: string): Promise<string> {
    try {
      // Download file from URL
      const axios = require('axios');
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Upload to S3
      return await this.uploadFile(buffer, fileName, 'audio/mpeg');
    } catch (error) {
      logger.error('Error uploading from URL:', error);
      throw error;
    }
  }

  /**
   * Local storage fallback (for development)
   */
  async saveLocally(fileBuffer: Buffer, fileName: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${Date.now()}-${fileName}`);
    fs.writeFileSync(filePath, fileBuffer);

    return filePath;
  }
}

export default new StorageService();
