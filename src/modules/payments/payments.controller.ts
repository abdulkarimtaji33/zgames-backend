import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards, Req, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('order/:orderId') findByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: { id: string; roles?: Array<{ name: string } | string> },
  ) {
    return this.svc.findByOrder(orderId, user);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get(':id') findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; roles?: Array<{ name: string } | string> },
  ) {
    return this.svc.findOne(id, user);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('intent') @ApiOperation({ summary: 'Create payment intent' })
  createIntent(@Body() dto: CreatePaymentIntentDto) { return this.svc.createIntent(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('confirm') @ApiOperation({ summary: 'Confirm payment' })
  confirm(@Body() dto: ConfirmPaymentDto) { return this.svc.confirm(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'finance_manager')
  @Post('refund') @ApiOperation({ summary: 'Refund payment' })
  refund(@Body() dto: RefundPaymentDto) { return this.svc.refund(dto); }

  @Public()
  @Post('webhooks/stripe') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Stripe webhook' })
  stripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    return this.svc.handleStripeWebhook(req.rawBody ?? Buffer.from(''), sig);
  }
}
