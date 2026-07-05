-- Run once on production to support digital gift card code inventory.
-- Safe to re-run: uses IF NOT EXISTS / checks where possible.

CREATE TABLE IF NOT EXISTS `gift_card_codes` (
  `id` varchar(36) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  `productId` varchar(36) NOT NULL,
  `variantId` varchar(36) DEFAULT NULL,
  `code` text NOT NULL,
  `status` enum('available','sold','disabled') NOT NULL DEFAULT 'available',
  `source` enum('manual','api') NOT NULL DEFAULT 'manual',
  `orderId` varchar(36) DEFAULT NULL,
  `orderItemId` varchar(36) DEFAULT NULL,
  `customerId` varchar(36) DEFAULT NULL,
  `soldAt` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_gift_card_codes_productId` (`productId`),
  KEY `IDX_gift_card_codes_variantId` (`variantId`),
  KEY `IDX_gift_card_codes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- product_variants: supplier API config
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'giftCardSupplierConfig');
SET @sql := IF(@col = 0, 'ALTER TABLE `product_variants` ADD COLUMN `giftCardSupplierConfig` json DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_items: delivered codes + fulfillment status
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'deliveredCodes');
SET @sql := IF(@col = 0, 'ALTER TABLE `order_items` ADD COLUMN `deliveredCodes` json DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'fulfillmentStatus');
SET @sql := IF(@col = 0, "ALTER TABLE `order_items` ADD COLUMN `fulfillmentStatus` enum('not_applicable','pending','fulfilled','partial') NOT NULL DEFAULT 'not_applicable'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
