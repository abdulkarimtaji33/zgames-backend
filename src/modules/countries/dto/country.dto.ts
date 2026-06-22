import { IsString, IsBoolean, IsOptional, IsNumber, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCountryDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() @Length(2,2) code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dialCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currencyCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) taxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() flagIcon?: string;
}
export class UpdateCountryDto extends PartialType(CreateCountryDto) {}
export class CountryQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 50;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
