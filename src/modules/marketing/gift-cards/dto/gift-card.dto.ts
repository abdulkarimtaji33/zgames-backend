import { IsNumber, IsOptional, IsString, IsDateString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class CreateGiftCardDto {
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() purchasedByCustomerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
}
export class RedeemGiftCardDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsUUID() customerId: string;
  @ApiProperty() @IsUUID() orderId: string;
  @ApiProperty() @IsNumber() @Min(0.01) @Type(() => Number) amount: number;
}
export class CheckGiftCardDto { @ApiProperty() @IsString() code: string; }
