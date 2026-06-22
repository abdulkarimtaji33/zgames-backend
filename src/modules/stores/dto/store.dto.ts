import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class CreateStoreDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() address: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() countryCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) longitude?: number;
  @ApiPropertyOptional() @IsOptional() openingHours?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
