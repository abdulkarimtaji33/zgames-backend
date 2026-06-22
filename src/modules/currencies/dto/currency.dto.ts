import { IsString, IsBoolean, IsOptional, IsNumber, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCurrencyDto {
  @ApiProperty() @IsString() @Length(3,3) code: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() symbol: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) exchangeRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateCurrencyDto extends PartialType(CreateCurrencyDto) {}
export class CurrencyQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 50;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
