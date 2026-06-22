import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttributeType } from '../entities/attribute.entity';

export class CreateAttributeDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional({ enum: AttributeType }) @IsOptional() @IsEnum(AttributeType) type?: AttributeType;
}
export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}

export class CreateAttributeOptionDto {
  @ApiProperty() @IsString() value: string;
  @ApiProperty() @IsString() label: string;
  @ApiPropertyOptional() @IsOptional() @IsString() colorCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sortOrder?: number;
}
export class UpdateAttributeOptionDto extends PartialType(CreateAttributeOptionDto) {}
