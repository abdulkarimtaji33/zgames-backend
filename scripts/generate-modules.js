const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'src', 'modules');

const modules = [
  ['auth', 'AuthModule', 'auth.module.ts'],
  ['users', 'UsersModule', 'users.module.ts'],
  ['customers', 'CustomersModule', 'customers.module.ts'],
  ['products', 'ProductsModule', 'products.module.ts'],
  ['categories', 'CategoriesModule', 'categories.module.ts'],
  ['brands', 'BrandsModule', 'brands.module.ts'],
  ['attributes', 'AttributesModule', 'attributes.module.ts'],
  ['inventory', 'InventoryModule', 'inventory.module.ts'],
  ['warehouses', 'WarehousesModule', 'warehouses.module.ts'],
  ['suppliers', 'SuppliersModule', 'suppliers.module.ts'],
  ['purchase-orders', 'PurchaseOrdersModule', 'purchase-orders.module.ts'],
  ['orders', 'OrdersModule', 'orders.module.ts'],
  ['payments', 'PaymentsModule', 'payments.module.ts'],
  ['shipping', 'ShippingModule', 'shipping.module.ts'],
  ['search', 'SearchModule', 'search.module.ts'],
  ['reviews', 'ReviewsModule', 'reviews.module.ts'],
  ['wishlist', 'WishlistModule', 'wishlist.module.ts'],
  ['compare', 'CompareModule', 'compare.module.ts'],
  ['blog', 'BlogModule', 'blog.module.ts'],
  ['cms-pages', 'CmsPagesModule', 'cms-pages.module.ts'],
  ['support-tickets', 'SupportTicketsModule', 'support-tickets.module.ts'],
  ['returns', 'ReturnsModule', 'returns.module.ts'],
  ['notifications', 'NotificationsModule', 'notifications.module.ts'],
  ['analytics', 'AnalyticsModule', 'analytics.module.ts'],
  ['reports', 'ReportsModule', 'reports.module.ts'],
  ['countries', 'CountriesModule', 'countries.module.ts'],
  ['currencies', 'CurrenciesModule', 'currencies.module.ts'],
  ['languages', 'LanguagesModule', 'languages.module.ts'],
  ['stores', 'StoresModule', 'stores.module.ts'],
  ['roles', 'RolesModule', 'roles.module.ts'],
  ['permissions', 'PermissionsModule', 'permissions.module.ts'],
  ['settings', 'SettingsModule', 'settings.module.ts'],
];

const marketingModules = [
  ['coupons', 'CouponsModule', 'coupons.module.ts'],
  ['flash-sales', 'FlashSalesModule', 'flash-sales.module.ts'],
  ['loyalty', 'LoyaltyModule', 'loyalty.module.ts'],
  ['gift-cards', 'GiftCardsModule', 'gift-cards.module.ts'],
  ['referrals', 'ReferralsModule', 'referrals.module.ts'],
  ['affiliates', 'AffiliatesModule', 'affiliates.module.ts'],
];

function writeModule(dir, className, fileName) {
  const file = path.join(dir, fileName);
  if (fs.existsSync(file)) return;

  const content = `import { Module } from '@nestjs/common';\n\n@Module({})\nexport class ${className} {}\n`;
  fs.writeFileSync(file, content);
}

for (const [folder, className, fileName] of modules) {
  writeModule(path.join(base, folder), className, fileName);
}

for (const [folder, className, fileName] of marketingModules) {
  writeModule(path.join(base, 'marketing', folder), className, fileName);
}

const marketingModuleFile = path.join(base, 'marketing', 'marketing.module.ts');
if (!fs.existsSync(marketingModuleFile)) {
  const imports = marketingModules
    .map(
      ([folder, className, fileName]) =>
        `import { ${className} } from './${folder}/${fileName.replace('.ts', '')}';`,
    )
    .join('\n');

  fs.writeFileSync(
    marketingModuleFile,
    `${imports}\nimport { Module } from '@nestjs/common';\n\n@Module({\n  imports: [${marketingModules.map(([, c]) => c).join(', ')}],\n  exports: [${marketingModules.map(([, c]) => c).join(', ')}],\n})\nexport class MarketingModule {}\n`,
  );
}

console.log('Module stubs generated');
