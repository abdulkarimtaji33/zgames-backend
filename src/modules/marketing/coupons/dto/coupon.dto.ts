import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export enum DiscountType { PERCENTAGE = 'percentage', FIXED = 'fixed', FREE_SHIPPING = 'free_shipping' }
export class CreateCouponDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: DiscountType }) @IsEnum(DiscountType) discountType: DiscountType;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) discountValue: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minimumOrderAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) maxDiscountPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) usageLimit?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) usageLimitPerCustomer?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() applicableProductIds?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() applicableCategoryIds?: string[];
}
export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
export class ValidateCouponDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) orderAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
}
export class CouponQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
