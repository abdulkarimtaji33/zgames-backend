import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsDateString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class FlashSaleProductDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) salePrice: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) stockLimit?: number;
}
export class CreateFlashSaleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsDateString() startsAt: string;
  @ApiProperty() @IsDateString() endsAt: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ type: [FlashSaleProductDto] }) @IsOptional() products?: FlashSaleProductDto[];
}
export class UpdateFlashSaleDto extends PartialType(CreateFlashSaleDto) {}
