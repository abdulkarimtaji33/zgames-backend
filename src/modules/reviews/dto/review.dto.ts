import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export enum ReviewStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected' }
export class CreateReviewDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) @Type(() => Number) rating: number;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pros?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cons?: string;
}
export class ReviewQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
}
