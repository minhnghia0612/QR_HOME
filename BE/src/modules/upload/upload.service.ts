import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class UploadService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(UploadService.name);
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'qrhome');
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9002'), 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9002');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    
    this.logger.log(`Attempting to connect to Minio at ${endPoint}:${port} (SSL: ${useSSL}, Bucket: ${this.bucketName})`);

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
    const minioEndPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const endPoint = minioEndPoint === 'minio' ? 'localhost' : minioEndPoint;
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const protocol = this.configService.get<string>('MINIO_USE_SSL') === 'true' ? 'https' : 'http';
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
