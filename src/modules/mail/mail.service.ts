import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('resend.apiKey');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = this.config.get<string>('resend.fromEmail') ?? 'noreply@zgames.ae';
  }

  async send(options: SendMailOptions): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email not configured — skipping message to ${options.to}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: options.from ?? this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
    }
  }

  async sendWelcome(to: string, firstName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to ZGames!',
      html: this.welcomeTemplate(firstName),
    });
  }

  async sendEmailVerification(to: string, firstName: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your email address',
      html: this.verificationTemplate(firstName, verifyUrl),
    });
  }

  async sendPasswordReset(to: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your ZGames password',
      html: this.passwordResetTemplate(firstName, resetUrl),
    });
  }

  async sendOrderConfirmation(
    to: string,
    firstName: string,
    orderNumber: string,
    total: number,
    currency: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `Order Confirmed: #${orderNumber}`,
      html: this.orderConfirmationTemplate(firstName, orderNumber, total, currency),
    });
  }

  async sendShippingUpdate(
    to: string,
    firstName: string,
    orderNumber: string,
    trackingNumber: string,
    carrier: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `Your order #${orderNumber} has shipped!`,
      html: this.shippingUpdateTemplate(firstName, orderNumber, trackingNumber, carrier),
    });
  }

  async sendAbandonedCart(to: string, firstName: string): Promise<void> {
    await this.send({
      to,
      subject: "You left something in your cart! 🎮",
      html: this.abandonedCartTemplate(firstName),
    });
  }

  private baseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #0a0a0f; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .logo { text-align: center; margin-bottom: 32px; }
            .logo h1 { color: #e53e3e; font-size: 28px; margin: 0; letter-spacing: 2px; }
            .card { background-color: #111118; border-radius: 12px; padding: 32px; border: 1px solid #1f1f2e; }
            h2 { color: #ffffff; margin-top: 0; }
            p { color: #a0aec0; line-height: 1.6; }
            .btn { display: inline-block; padding: 14px 32px; background-color: #e53e3e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
            .footer { text-align: center; margin-top: 32px; color: #4a5568; font-size: 12px; }
            .highlight { color: #ffffff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo"><h1>ZGAMES</h1></div>
            <div class="card">${content}</div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZGames. All rights reserved.</p>
              <p>Dubai, UAE | support@zgames.ae</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private welcomeTemplate(firstName: string): string {
    return this.baseTemplate(`
      <h2>Welcome to ZGames, ${firstName}! 🎮</h2>
      <p>Your account has been successfully created. You're now part of the ultimate gaming community in the GCC.</p>
      <p>Start exploring thousands of games, consoles, accessories, and collectibles.</p>
      <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}" class="btn">Shop Now</a>
    `);
  }

  private verificationTemplate(firstName: string, verifyUrl: string): string {
    return this.baseTemplate(`
      <h2>Verify your email, ${firstName}</h2>
      <p>Please verify your email address to activate your account. This link expires in 24 hours.</p>
      <a href="${verifyUrl}" class="btn">Verify Email</a>
      <p>If you didn't create an account, please ignore this email.</p>
    `);
  }

  private passwordResetTemplate(firstName: string, resetUrl: string): string {
    return this.baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>Hi ${firstName}, we received a request to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `);
  }

  private orderConfirmationTemplate(
    firstName: string,
    orderNumber: string,
    total: number,
    currency: string,
  ): string {
    return this.baseTemplate(`
      <h2>Order Confirmed! 🎉</h2>
      <p>Hi ${firstName}, your order has been confirmed.</p>
      <p>Order Number: <span class="highlight">#${orderNumber}</span></p>
      <p>Total: <span class="highlight">${currency} ${total.toFixed(2)}</span></p>
      <p>We'll send you a shipping update once your order is dispatched.</p>
      <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/orders" class="btn">View Order</a>
    `);
  }

  private shippingUpdateTemplate(
    firstName: string,
    orderNumber: string,
    trackingNumber: string,
    carrier: string,
  ): string {
    return this.baseTemplate(`
      <h2>Your Order Has Shipped! 🚚</h2>
      <p>Hi ${firstName}, great news! Your order <span class="highlight">#${orderNumber}</span> is on its way.</p>
      <p>Carrier: <span class="highlight">${carrier}</span></p>
      <p>Tracking Number: <span class="highlight">${trackingNumber}</span></p>
      <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/track-order" class="btn">Track Order</a>
    `);
  }

  private abandonedCartTemplate(firstName: string): string {
    return this.baseTemplate(`
      <h2>Did you forget something? 🎮</h2>
      <p>Hi ${firstName}, you left some amazing games in your cart!</p>
      <p>Don't miss out — limited stock items sell fast.</p>
      <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/cart" class="btn">Complete Purchase</a>
    `);
  }
}
