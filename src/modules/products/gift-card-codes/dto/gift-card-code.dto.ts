import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkUploadCodesDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayNotEmpty() @IsString({ each: true }) codes: string[];
}

export class GiftCardSupplierConfigDto {
  @ApiProperty() @IsBoolean() enabled: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() apiUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() apiKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['GET', 'POST']) method?: 'GET' | 'POST';
  @ApiPropertyOptional() @IsOptional() @IsString() bodyTemplate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codePath?: string;
}

export class ManualFulfillDto {
  @ApiProperty() @IsString() code: string;
}
