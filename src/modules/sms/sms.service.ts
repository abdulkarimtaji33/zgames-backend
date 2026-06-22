import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly client: ReturnType<typeof twilio>;
  private readonly fromNumber: string;
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {
    const accountSid = this.config.get<string>('twilio.accountSid');
    const authToken = this.config.get<string>('twilio.authToken');
    this.fromNumber = this.config.get<string>('twilio.fromNumber') ?? '';

    if (accountSid && authToken && accountSid.startsWith('AC')) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async send(to: string, body: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(`SMS not configured — skipping message to ${to}`);
      return;
    }
    try {
      await this.client.messages.create({ to, from: this.fromNumber, body });
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error}`);
    }
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.send(to, `Your ZGames OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`);
  }

  async sendOrderConfirmation(to: string, orderNumber: string): Promise<void> {
    await this.send(to, `ZGames: Your order #${orderNumber} has been confirmed. Thank you for shopping with us!`);
  }

  async sendShippingUpdate(to: string, orderNumber: string, trackingNumber: string): Promise<void> {
    await this.send(to, `ZGames: Order #${orderNumber} has shipped! Track with: ${trackingNumber}`);
  }

  async sendAbandonedCart(to: string): Promise<void> {
    await this.send(to, `ZGames: You have items waiting in your cart! Complete your purchase now.`);
  }
}
