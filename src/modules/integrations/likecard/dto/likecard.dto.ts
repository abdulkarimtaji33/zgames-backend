import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SyncPlaystationCatalogDto {
  @ApiPropertyOptional({ description: 'Override the configured flat markup percent for this sync run only' })
  @IsOptional()
  markupPercent?: number;
}

export class ListLikeCardOrdersQueryDto {
  @ApiPropertyOptional() @IsOptional() page?: number;

  @ApiPropertyOptional() @IsOptional() @IsIn(['asc', 'desc']) orderType?: 'asc' | 'desc';

  @ApiPropertyOptional() @IsOptional() fromUnixTime?: number;

  @ApiPropertyOptional() @IsOptional() toUnixTime?: number;
}

export class GetLikeCardOrderDetailsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() orderId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
}
