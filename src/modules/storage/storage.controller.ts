import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { IsIn, IsString, IsNotEmpty } from 'class-validator';
import { StorageService, UploadResult } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const ALLOWED_FOLDERS = [
  'products',
  'categories',
  'brands',
  'blogs',
  'avatars',
  'documents',
] as const;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

class UploadDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_FOLDERS)
  folder: (typeof ALLOWED_FOLDERS)[number];
}

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to local disk storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDto,
  ): Promise<UploadResult> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    return this.storage.saveFile(dto.folder, file.originalname, file.buffer);
  }
}
