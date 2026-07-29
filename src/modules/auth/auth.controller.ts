import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterCustomerDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AuthResponseDto,
  OAuthExchangeDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OAuthProviderType } from './entities/oauth-provider.entity';
import { GoogleProfile } from './strategies/google.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('customer/register')
  @ApiOperation({ summary: 'Register a new customer' })
  async registerCustomer(
    @Body() dto: RegisterCustomerDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.registerCustomer(
      dto,
      ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as a customer' })
  async loginCustomer(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.loginCustomer(dto, ip, req.headers['user-agent']);
  }

  @Public()
  @Post('bootstrap')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create default roles, permissions, and super admin (first run only)' })
  async bootstrapAdmin(): Promise<{ email: string; password: string; message: string }> {
    return this.authService.bootstrapAdmin();
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as admin/staff user' })
  async loginUser(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.loginUser(dto, ip, req.headers['user-agent']);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(
      dto.refreshToken,
      ip,
      req.headers['user-agent'],
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  async logout(@Body() dto: RefreshTokenDto, @CurrentUser() user: { id: string; roles?: unknown }): Promise<void> {
    const type: 'user' | 'customer' = Array.isArray(user.roles) ? 'user' : 'customer';
    return this.authService.logout(dto.refreshToken, { id: user.id, type });
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify customer email' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully' };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  googleAuth(): void {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: Request & { user: { accessToken: string; refreshToken: string; profile: GoogleProfile } },
    @Res() res: Response,
    @Ip() ip: string,
  ): Promise<void> {
    const { profile, accessToken, refreshToken } = req.user;
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? '';
    const lastName = profile.name?.familyName ?? '';

    const tokens = await this.authService.handleOAuthCallback(
      OAuthProviderType.GOOGLE,
      profile.id,
      email,
      firstName,
      lastName,
      accessToken,
      refreshToken,
      ip,
      req.headers['user-agent'],
    );

    const code = await this.authService.createOAuthExchangeCode(tokens);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth' })
  facebookAuth(): void {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookCallback(
    @Req() req: Request & { user: { accessToken: string; profile: { id: string; emails?: Array<{ value: string }>; name?: { givenName: string; familyName: string } } } },
    @Res() res: Response,
    @Ip() ip: string,
  ): Promise<void> {
    const { profile, accessToken } = req.user;
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? '';
    const lastName = profile.name?.familyName ?? '';

    const tokens = await this.authService.handleOAuthCallback(
      OAuthProviderType.FACEBOOK,
      profile.id,
      email,
      firstName,
      lastName,
      accessToken,
      undefined,
      ip,
      req.headers['user-agent'],
    );

    const code = await this.authService.createOAuthExchangeCode(tokens);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  @Public()
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a short-lived OAuth redirect code for real tokens' })
  async exchangeOAuthCode(@Body() dto: OAuthExchangeDto): Promise<AuthResponseDto> {
    return this.authService.exchangeOAuthCode(dto.code);
  }
}
