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
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost').trim();
    const port = parseInt(this.configService.get<string>('MINIO_PORT', '9002'), 10);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin').trim();
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin').trim();


    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async onModuleInit() {
    const endPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9002');
    
    this.logger.log(`Initializing Minio at internal address ${endPoint}:${port} (Bucket: "${this.bucketName}")`);

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
      this.logger.error(`Failed to connect to Minio at ${endPoint}:${port}`, error);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = "uploads"): Promise<string> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Validate file type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`The images are allowed format (jpeg, png, gif, webp).`);
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`The image must be smaller than 10 MB.`);
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = file.originalname.split(".").pop();
    const filename = `${folder}/${timestamp}-${randomString}.${ext}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        filename,
        file.buffer,
        file.size,
        {
          "Content-Type": file.mimetype,
        }
      );

      let baseUrl = this.configService.get<string>('MINIO_PUBLIC_URL');
      
      if (!baseUrl) {
        const minioEndPoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
        const defaultPublicEndpoint = minioEndPoint === 'minio' ? 'localhost' : minioEndPoint;
        
        const publicEndpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT', defaultPublicEndpoint);
        
        const internalPort = parseInt(this.configService.get<string>('MINIO_PORT', '9002'), 10);
        const publicPortStr = this.configService.get<string>('MINIO_PUBLIC_PORT');
        const publicPort = publicPortStr ? parseInt(publicPortStr, 10) : undefined;
        
        const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
        const publicUseSSLStr = this.configService.get<string>('MINIO_PUBLIC_USE_SSL');
        const isPublicSSL = publicUseSSLStr !== undefined ? publicUseSSLStr === 'true' : useSSL;
        
        const protocol = isPublicSSL ? "https" : "http";
        const publicUrlPrefix = this.configService.get<string>('MINIO_PUBLIC_URL_PREFIX', '');
        
        const finalPort = publicPort !== undefined ? publicPort : internalPort;
        const finalPortStr = (finalPort === 80 || finalPort === 443) ? "" : `:${finalPort}`;

        baseUrl = `${protocol}://${publicEndpoint}${finalPortStr}${publicUrlPrefix}`;
      }
      
      return `${baseUrl}/${this.bucketName}/${filename}`;
    } catch (error) {
      this.logger.error("Error uploading file to Minio", error);
      throw new BadRequestException("Failed to upload file");
    }
  }

  async removeFile(fileUrl: string): Promise<void> {
    const objectName = this.extractObjectName(fileUrl);
    if (!objectName) {
      return;
    }

    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error("Error removing file from MinIO:", error);
      // We don't throw here to avoid blocking the user update if cleanup fails
    }
  }

  private extractObjectName(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      // URL format: http://endpoint:port/bucket/filename
      // path would be /bucket/filename
      const pathParts = url.pathname.split("/");
      // pathParts[0] is empty, pathParts[1] is bucket, rest is filename
      if (pathParts.length < 3) return null;
      return pathParts.slice(2).join("/");
    } catch {
      return null;
    }
  }
}
