import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsArray, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

const toBoolean = ({ value }: { value: unknown }) => (typeof value === 'string' ? value === 'true' : Boolean(value));
import { ProductType, ProductPlatform, ProductRegion, ProductGenre } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional({ enum: ProductType }) @IsOptional() @IsEnum(ProductType) type?: ProductType;
  @ApiPropertyOptional({ enum: ProductPlatform }) @IsOptional() @IsEnum(ProductPlatform) platform?: ProductPlatform;
  @ApiPropertyOptional({ enum: ProductRegion }) @IsOptional() @IsEnum(ProductRegion) region?: ProductRegion;
  @ApiPropertyOptional({ enum: ProductGenre }) @IsOptional() @IsEnum(ProductGenre) genre?: ProductGenre;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) salePrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) costPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUUID('4', { each: true }) categoryIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPreorder?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isComingSoon?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() releaseDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) preorderDeposit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() publisher?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() developer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) weight?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() metaTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tags?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class CreateProductVariantDto {
  @ApiProperty() @IsString() sku: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) salePrice?: number;
  @ApiPropertyOptional() @IsOptional() options?: Array<{ attributeId: string; optionId: string }>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sortOrder?: number;
}
export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {}

export class ProductQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional({ enum: ProductPlatform, isArray: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Array.isArray(value) ? value : [value]))
  @IsEnum(ProductPlatform, { each: true })
  platform?: ProductPlatform[];
  @ApiPropertyOptional({ enum: ProductRegion, isArray: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Array.isArray(value) ? value : [value]))
  @IsEnum(ProductRegion, { each: true })
  region?: ProductRegion[];
  @ApiPropertyOptional({ enum: ProductGenre, isArray: true })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : Array.isArray(value) ? value : [value]))
  @IsEnum(ProductGenre, { each: true })
  genre?: ProductGenre[];
  @ApiPropertyOptional() @IsOptional() @Transform(toBoolean) @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @Transform(toBoolean) @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @Transform(toBoolean) @IsBoolean() isPreorder?: boolean;
  @ApiPropertyOptional() @IsOptional() @Transform(toBoolean) @IsBoolean() isComingSoon?: boolean;
  @ApiPropertyOptional() @IsOptional() @Transform(toBoolean) @IsBoolean() inStock?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortOrder?: 'ASC' | 'DESC';
}

export class AddProductImageDto {
  @ApiProperty() @IsString() url: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sortOrder?: number;
}

export class SetRelatedProductsDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) productIds: string[];
}

export class ReorderImagesDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) imageIds: string[];
}
