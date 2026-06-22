import { IsString, IsOptional, IsNumber, Min, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentIntentDto {
  @ApiProperty() @IsUUID() orderId: string;
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method: PaymentMethod;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() returnUrl?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty() @IsUUID() paymentId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gatewayPaymentId?: string;
  @ApiPropertyOptional() @IsOptional() metadata?: Record<string, unknown>;
}

export class RefundPaymentDto {
  @ApiProperty() @IsUUID() paymentId: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class StripeWebhookDto {
  type: string;
  data: { object: Record<string, unknown> };
}
