import { IsString, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
export class CreateRoleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isSystem?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUUID('4', { each: true }) permissionIds?: string[];
}
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
export class AssignPermissionsDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) permissionIds: string[];
}
