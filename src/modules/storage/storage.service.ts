import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUploadResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('aws.region')!;
    const accessKeyId = this.config.get<string>('aws.accessKeyId')!;
    const secretAccessKey = this.config.get<string>('aws.secretAccessKey')!;
    this.bucket = this.config.get<string>('aws.bucket')!;

    this.s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    this.baseUrl = `https://${this.bucket}.s3.${region}.amazonaws.com`;
  }

  async getPresignedUploadUrl(
    folder: string,
    fileName: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<PresignedUploadResult> {
    const ext = fileName.split('.').pop();
    const key = `${folder}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });

    return {
      uploadUrl,
      fileUrl: `${this.baseUrl}/${key}`,
      key,
    };
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.s3.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  extractKeyFromUrl(url: string): string {
    return url.replace(`${this.baseUrl}/`, '');
  }

  getFileUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}
