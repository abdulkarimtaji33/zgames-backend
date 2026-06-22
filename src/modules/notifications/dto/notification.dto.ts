import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export { NotificationChannel } from '../entities/notification.entity';
export enum NotificationType { ORDER = 'order', PAYMENT = 'payment', PROMOTION = 'promotion', SYSTEM = 'system' }
export class UpdatePreferenceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() channel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEnabled?: boolean;
}
export class NotificationQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRead?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
}
