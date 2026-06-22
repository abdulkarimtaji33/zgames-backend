import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateReferralDto {
  @ApiProperty() @IsUUID() referrerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referralCode?: string;
}
