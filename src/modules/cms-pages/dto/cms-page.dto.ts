import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
export class CreateCmsPageDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' }) slug?: string;
  @ApiPropertyOptional() @IsOptional() content?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsString() metaTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showInFooter?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showInHeader?: boolean;
}
export class UpdateCmsPageDto extends PartialType(CreateCmsPageDto) {}
