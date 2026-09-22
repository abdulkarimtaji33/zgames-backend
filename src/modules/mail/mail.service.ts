import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly resend: Resend | null;
  private readonly smtpTransport: nodemailer.Transporter | null;
  private readonly smtpFromEmail: string | null;
  private readonly fromEmail: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    // SMTP (e.g. Gmail + app password) takes priority over Resend when both are configured — it's
    // the transport actually verified against a real inbox for this account.
    const smtpUser = this.config.get<string>('smtp.user');
    const smtpPass = this.config.get<string>('smtp.pass');
    if (smtpUser && smtpPass) {
      this.smtpTransport = nodemailer.createTransport({
        host: this.config.get<string>('smtp.host') ?? 'smtp.gmail.com',
        port: this.config.get<number>('smtp.port') ?? 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.smtpFromEmail = smtpUser;
    } else {
      this.smtpTransport = null;
      this.smtpFromEmail = null;
    }

    const apiKey = this.config.get<string>('resend.apiKey');
    this.resend = !this.smtpTransport && apiKey && apiKey !== 'placeholder' ? new Resend(apiKey) : null;
    this.fromEmail = this.smtpFromEmail ?? this.config.get<string>('resend.fromEmail') ?? 'noreply@cgagames.com';
  }

  /** Returns whether the email was actually handed off successfully — callers that need to tell
   * the customer/admin whether delivery really happened (order confirmation, gift-card codes)
   * should check this instead of assuming success just because the call didn't throw. */
  async send(options: SendMailOptions): Promise<boolean> {
    if (this.smtpTransport) {
      try {
        await this.smtpTransport.sendMail({
          from: options.from ?? this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        return true;
      } catch (error) {
        this.logger.error(`Failed to send email (SMTP) to ${options.to}: ${error}`);
        return false;
      }
    }

    if (!this.resend) {
      this.logger.warn(`Email not configured — skipping message to ${options.to}`);
      return false;
    }

    try {
      await this.resend.emails.send({
        from: options.from ?? this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error}`);
      return false;
    }
  }

  async sendWelcome(to: string, firstName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to CGA Games!',
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
      subject: 'Reset your CGA Games password',
      html: this.passwordResetTemplate(firstName, resetUrl),
    });
  }

  async sendOrderConfirmation(
    to: string,
    firstName: string,
    orderNumber: string,
    total: number,
    currency: string,
  ): Promise<boolean> {
    return this.send({
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

  async sendNewOrderAdminAlert(
    to: string,
    orderNumber: string,
    customerName: string,
    customerEmail: string,
    total: number,
    currency: string,
    items: Array<{ name: string; quantity: number; unitPrice: number }>,
  ): Promise<void> {
    await this.send({
      to,
      subject: `🛒 New Order #${orderNumber} — ${currency} ${total.toFixed(2)}`,
      html: this.newOrderAdminAlertTemplate(orderNumber, customerName, customerEmail, total, currency, items),
    });
  }

  async sendGiftCardDelivery(
    to: string,
    firstName: string,
    productName: string,
    codes: string[],
    orderNumber: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: `Your ${productName} code${codes.length > 1 ? 's are' : ' is'} ready! 🎁`,
      html: this.giftCardDeliveryTemplate(firstName, productName, codes, orderNumber),
    });
  }

  async sendGiftCardShortfallAlert(to: string, orderNumber: string, productName: string, shortfall: number): Promise<void> {
    await this.send({
      to,
      subject: `⚠️ Gift card stock needed — order #${orderNumber}`,
      html: this.baseTemplate(`
        <h2>Gift Card Stock Shortage</h2>
        <p>Order <span class="highlight">#${orderNumber}</span> needs <span class="highlight">${shortfall}</span> more code(s) for "${productName}" but the inventory pool is empty and no supplier API filled the gap.</p>
        <p>Please upload more codes or manually assign a code to the customer from the order detail page as soon as possible.</p>
        <a href="${process.env.ADMIN_FRONTEND_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/orders" class="btn">Open Orders</a>
      `),
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
            <div class="logo"><h1>CGA GAMES</h1></div>
            <div class="card">${content}</div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CGA Games. All rights reserved.</p>
              <p>Dubai, UAE | support@cgagames.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private welcomeTemplate(firstName: string): string {
    return this.baseTemplate(`
      <h2>Welcome to CGA Games, ${firstName}! 🎮</h2>
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

  private newOrderAdminAlertTemplate(
    orderNumber: string,
    customerName: string,
    customerEmail: string,
    total: number,
    currency: string,
    items: Array<{ name: string; quantity: number; unitPrice: number }>,
  ): string {
    const rows = items.map((i) => `
      <tr>
        <td style="padding:8px 0;color:#e2e8f0;">${i.name} × ${i.quantity}</td>
        <td style="padding:8px 0;color:#e2e8f0;text-align:right;">${currency} ${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    return this.baseTemplate(`
      <h2>New Order Received 🛒</h2>
      <p>Order <span class="highlight">#${orderNumber}</span> was just placed by <span class="highlight">${customerName}</span> (${customerEmail}).</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
      <p>Total: <span class="highlight">${currency} ${total.toFixed(2)}</span></p>
      <a href="${process.env.ADMIN_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000'}/admin/orders" class="btn">View in Admin Panel</a>
    `);
  }

  private giftCardDeliveryTemplate(firstName: string, productName: string, codes: string[], orderNumber: string): string {
    const codeBlocks = codes.map((code) => `
      <div style="background:#0a0a0f;border:2px dashed #e53e3e;border-radius:10px;padding:20px;text-align:center;margin:12px 0;">
        <p style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:3px;word-break:break-all;">${code}</p>
      </div>
    `).join('');
    return this.baseTemplate(`
      <h2>Your ${productName} ${codes.length > 1 ? 'Codes are' : 'Code is'} Ready! 🎁</h2>
      <p>Hi ${firstName}, thanks for your order <span class="highlight">#${orderNumber}</span>! Here ${codes.length > 1 ? 'are your redemption codes' : 'is your redemption code'}.</p>
      ${codeBlocks}
      <p>Redeem ${codes.length > 1 ? 'these codes' : 'this code'} directly on the issuer's platform (e.g. PlayStation Store, Xbox, Steam) following their standard redemption steps. Keep it safe — treat it like cash.</p>
      <a href="${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/gift-cards" class="btn">View My Codes</a>
    `);
  }
}
