import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class TrackEventDto {
  @ApiProperty() @IsString() event: string;
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referrer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() properties?: Record<string, unknown>;
}
export class ReportQueryDto {
  @ApiPropertyOptional() @IsOptional() startDate?: string;
  @ApiPropertyOptional() @IsOptional() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() groupBy?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 10;
}
