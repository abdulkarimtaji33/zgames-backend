import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentTracking } from './entities/shipment-tracking.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { Product } from '../products/entities/product.entity';
import { GiftCardCodesModule } from '../products/gift-card-codes/gift-card-codes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, Shipment, ShipmentTracking, Product]),
    MailModule,
    SettingsModule,
    NotificationsModule,
    UsersModule,
    forwardRef(() => GiftCardCodesModule),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
