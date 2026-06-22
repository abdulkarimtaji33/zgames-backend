import { IsString, IsOptional, IsArray, IsUUID, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class CreatePurchaseOrderItemDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) quantity: number;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) unitCost: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsUUID() supplierId: string;
  @ApiProperty() @IsUUID() warehouseId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expectedAt?: string;
  @ApiProperty({ type: [CreatePurchaseOrderItemDto] }) @IsArray() items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {}

export class ReceiveItemsDto {
  @ApiProperty({ description: 'Map of itemId to received quantity' })
  receivedItems: Record<string, number>;
}

export class PurchaseOrderQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PurchaseOrderStatus) status?: PurchaseOrderStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() supplierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
}
