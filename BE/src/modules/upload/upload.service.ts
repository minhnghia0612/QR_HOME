import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class UploadService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(UploadService.name);
  private readonly bucketName = process.env.MINIO_BUCKET_NAME || 'qrhome';

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        // Make bucket public for reading images
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Bucket "${this.bucketName}" created and set to public read`);
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists`);
      }
    } catch (error) {
      this.logger.error('Error initializing Minio bucket', error);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    
    // Determine the public URL format based on environment
    // In dev: localhost:9000/qrhome/..., In prod, it might be behind a reverse proxy
    const endPoint = process.env.MINIO_ENDPOINT === 'minio' ? 'localhost' : process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const baseUrl = `${protocol}://${endPoint}:${port}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        uniqueName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );
      
      return `${baseUrl}/${this.bucketName}/${uniqueName}`;
    } catch (error) {
      this.logger.error('Error uploading file to Minio', error);
      throw new BadRequestException('Failed to upload file');
    }
  }
}
