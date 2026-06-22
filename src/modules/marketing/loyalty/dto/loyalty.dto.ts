import { IsNumber, IsOptional, IsString, IsUUID, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export enum LoyaltyTransactionType { EARNED = 'earned', REDEEMED = 'redeemed', ADJUSTED = 'adjusted', EXPIRED = 'expired' }
export class AdjustLoyaltyDto {
  @ApiProperty() @IsUUID() customerId: string;
  @ApiProperty() @IsNumber() @Type(() => Number) points: number;
  @ApiProperty({ enum: LoyaltyTransactionType }) @IsEnum(LoyaltyTransactionType) type: LoyaltyTransactionType;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
export class RedeemPointsDto {
  @ApiProperty() @IsUUID() customerId: string;
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) points: number;
  @ApiProperty() @IsUUID() orderId: string;
}
