import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import { CreateGiftCardDto, RedeemGiftCardDto, CheckGiftCardDto } from './dto/gift-card.dto';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

class GenerateBatchDto {
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) count: number;
  @ApiProperty() @IsNumber() @Min(1) @Type(() => Number) amount: number;
}

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly svc: GiftCardsService) {}
  @Public() @Post('check') check(@Body() dto: CheckGiftCardDto) { return this.svc.check(dto.code); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Post('redeem') redeem(@Body() dto: RedeemGiftCardDto) { return this.svc.redeem(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Get() findAll() { return this.svc.findAll(); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Post() create(@Body() dto: CreateGiftCardDto) { return this.svc.create((dto as unknown as { amount: number }).amount ?? 0, (dto as unknown as { expiresAt?: Date }).expiresAt, (dto as unknown as { sentToEmail?: string }).sentToEmail); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Post('batch') generateBatch(@Body() dto: GenerateBatchDto) { return this.svc.generateBatch(dto.count, dto.amount); }
}
