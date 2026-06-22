import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { StorageService, PresignedUploadResult } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const ALLOWED_FOLDERS = [
  'products',
  'categories',
  'brands',
  'blogs',
  'avatars',
  'documents',
] as const;

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
] as const;

class PresignedUploadDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_FOLDERS)
  folder: (typeof ALLOWED_FOLDERS)[number];

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: (typeof ALLOWED_CONTENT_TYPES)[number];
}

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presigned-upload')
  @ApiOperation({ summary: 'Get a presigned URL for direct S3 upload' })
  async getPresignedUploadUrl(
    @Body() dto: PresignedUploadDto,
  ): Promise<PresignedUploadResult> {
    return this.storage.getPresignedUploadUrl(
      dto.folder,
      dto.fileName,
      dto.contentType,
    );
  }
}
