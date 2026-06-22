import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class ReportFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() groupBy?: 'day' | 'week' | 'month';
  @ApiPropertyOptional() @IsOptional() @IsString() countryCode?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 10;
}
