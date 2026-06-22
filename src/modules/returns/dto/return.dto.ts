import { IsString, IsOptional, IsArray, IsUUID, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export enum ReturnStatus { REQUESTED = 'requested', APPROVED = 'approved', REJECTED = 'rejected', RECEIVED = 'received', REFUNDED = 'refunded' }
export enum ReturnReason { DEFECTIVE = 'defective', WRONG_ITEM = 'wrong_item', NOT_AS_DESCRIBED = 'not_as_described', CHANGED_MIND = 'changed_mind', OTHER = 'other' }
export class CreateReturnItemDto {
  @ApiProperty() @IsUUID() orderItemId: string;
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) quantity: number;
  @ApiProperty({ enum: ReturnReason }) @IsEnum(ReturnReason) reason: ReturnReason;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
export class CreateReturnDto {
  @ApiProperty() @IsUUID() orderId: string;
  @ApiProperty({ type: [CreateReturnItemDto] }) @IsArray() items: CreateReturnItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() customerNotes?: string;
}
export class UpdateReturnDto {
  @ApiProperty({ enum: ReturnStatus }) @IsEnum(ReturnStatus) status: ReturnStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() adminNotes?: string;
}
export class ReturnQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ReturnStatus) status?: ReturnStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() orderId?: string;
}
