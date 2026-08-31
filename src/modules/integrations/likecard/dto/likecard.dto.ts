import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SyncPlaystationCatalogDto {
  @ApiPropertyOptional({ description: 'Override the configured flat markup percent for this sync run only' })
  @IsOptional()
  markupPercent?: number;
}

export class SyncCategoryDto {
  @ApiPropertyOptional({ description: 'Substring (case-insensitive) of the LikeCard top-level category name to sync, e.g. "roblox"' })
  @IsString()
  categoryName: string;

  @ApiPropertyOptional({ description: 'Override the configured flat markup percent for this sync run only' })
  @IsOptional()
  markupPercent?: number;
}

export class SyncPopularCatalogsDto {
  @ApiPropertyOptional({ description: 'Override the configured flat markup percent for this sync run only' })
  @IsOptional()
  markupPercent?: number;
}

export class TestPurchaseDto {
  @ApiPropertyOptional({ description: 'One of LikeCard\'s designated test product IDs' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Unique reference ID for this test order; auto-generated if omitted' })
  @IsOptional()
  @IsString()
  referenceId?: string;
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
