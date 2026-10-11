import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export enum TicketStatus { OPEN = 'open', IN_PROGRESS = 'in_progress', RESOLVED = 'resolved', CLOSED = 'closed' }
export enum TicketPriority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', URGENT = 'urgent' }
export class CreateTicketDto {
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsString() message: string;
  @ApiPropertyOptional({ enum: TicketPriority }) @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() orderId?: string;
}
export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus }) @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @ApiPropertyOptional({ enum: TicketPriority }) @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedToId?: string;
}
export class AddMessageDto {
  @ApiProperty() @IsString() message: string;
  @ApiPropertyOptional() @IsOptional() isInternal?: boolean;
}
export class TicketQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @ApiPropertyOptional() @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
}
