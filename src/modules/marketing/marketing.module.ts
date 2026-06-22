import { Module } from '@nestjs/common';
import { CouponsModule } from './coupons/coupons.module';
import { FlashSalesModule } from './flash-sales/flash-sales.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AffiliatesModule } from './affiliates/affiliates.module';

@Module({
  imports: [CouponsModule, FlashSalesModule, LoyaltyModule, GiftCardsModule, ReferralsModule, AffiliatesModule],
  exports: [CouponsModule, FlashSalesModule, LoyaltyModule, GiftCardsModule, ReferralsModule, AffiliatesModule],
})
export class MarketingModule {}
