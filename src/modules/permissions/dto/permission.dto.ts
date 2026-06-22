import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
export class CreatePermissionDto {
  @ApiProperty({ example: 'products' }) @IsString() resource: string;
  @ApiProperty({ example: 'create' }) @IsString() action: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
