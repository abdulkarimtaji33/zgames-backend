import { IsString, IsOptional, IsNumber, Min, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InventoryTransactionType } from '../entities/inventory-transaction.entity';

export class AdjustStockDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty() @IsUUID() warehouseId: string;
  @ApiProperty() @IsNumber() @Type(() => Number) quantity: number;
  @ApiProperty({ enum: InventoryTransactionType }) @IsEnum(InventoryTransactionType) type: InventoryTransactionType;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class TransferStockDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiProperty() @IsUUID() fromWarehouseId: string;
  @ApiProperty() @IsUUID() toWarehouseId: string;
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class InventoryQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 50;
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() lowStock?: boolean;
}
