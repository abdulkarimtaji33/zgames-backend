import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export enum SettingType { STRING = 'string', NUMBER = 'number', BOOLEAN = 'boolean', JSON = 'json' }
export class UpsertSettingDto {
  @ApiProperty() @IsString() key: string;
  @ApiProperty() @IsString() value: string;
  @ApiPropertyOptional() @IsOptional() @IsString() group?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(SettingType) type?: SettingType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
export class BulkUpsertSettingsDto {
  @ApiProperty({ type: [UpsertSettingDto] }) settings: UpsertSettingDto[];
}
