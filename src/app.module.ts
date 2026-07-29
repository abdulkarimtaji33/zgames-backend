import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { DatabaseModule } from './database/database.module';
import { AppGraphqlModule } from './graphql/graphql.module';
import { StorageModule } from './modules/storage/storage.module';
import { MailModule } from './modules/mail/mail.module';
import { SmsModule } from './modules/sms/sms.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { GiftCardCodesModule } from './modules/products/gift-card-codes/gift-card-codes.module';
import { LikeCardModule } from './modules/integrations/likecard/likecard.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CompareModule } from './modules/compare/compare.module';
import { BlogModule } from './modules/blog/blog.module';
import { CmsPagesModule } from './modules/cms-pages/cms-pages.module';
import { SupportTicketsModule } from './modules/support-tickets/support-tickets.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CountriesModule } from './modules/countries/countries.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { StoresModule } from './modules/stores/stores.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.development', '.env'],
    }),
    DatabaseModule,
    AppGraphqlModule,
    StorageModule,
    MailModule,
    SmsModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    ProductsModule,
    GiftCardCodesModule,
    LikeCardModule,
    CategoriesModule,
    BrandsModule,
    AttributesModule,
    InventoryModule,
    WarehousesModule,
    SuppliersModule,
    PurchaseOrdersModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    MarketingModule,
    ReviewsModule,
    WishlistModule,
    CompareModule,
    BlogModule,
    CmsPagesModule,
    SupportTicketsModule,
    ReturnsModule,
    NotificationsModule,
    AnalyticsModule,
    ReportsModule,
    CountriesModule,
    CurrenciesModule,
    LanguagesModule,
    StoresModule,
    RolesModule,
    PermissionsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
