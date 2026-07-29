-- LikeCard integration: schema changes needed since TYPEORM_SYNCHRONIZE=false in this project's .env.
-- This repo has no TypeORM migration runner set up (src/database/migrations only has a .gitkeep),
-- so run this by hand against the target database before deploying the LikeCard integration.

ALTER TABLE `product_variants`
  ADD COLUMN `likecardProductId` VARCHAR(100) NULL AFTER `giftCardSupplierConfig`;

ALTER TABLE `gift_card_codes`
  ADD COLUMN `likecardOrderId` VARCHAR(100) NULL AFTER `notes`,
  ADD COLUMN `likecardReferenceId` VARCHAR(100) NULL AFTER `likecardOrderId`;

-- Adds 'oman' to the products.region enum alongside the existing values.
ALTER TABLE `products`
  MODIFY COLUMN `region` ENUM('uae','ksa','qatar','kuwait','oman','bahrain','international','global') NOT NULL DEFAULT 'global';
