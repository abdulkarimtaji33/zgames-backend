import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from './entities/gift-card.entity';
import { GiftCardUsage } from './entities/gift-card-usage.entity';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardsController } from './gift-cards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard, GiftCardUsage])],
  providers: [GiftCardsService],
  controllers: [GiftCardsController],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
