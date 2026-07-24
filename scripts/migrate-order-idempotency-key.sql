-- Run once to support idempotent order creation (prevents duplicate orders on checkout retry).
-- Safe to re-run: checks for existing column/index before adding.

-- orders: idempotency key column
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'idempotencyKey');
SET @sql := IF(@col = 0, 'ALTER TABLE `orders` ADD COLUMN `idempotencyKey` varchar(100) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- orders: unique index on idempotency key (MySQL unique indexes allow multiple NULLs)
SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'IDX_orders_idempotencyKey');
SET @sql := IF(@idx = 0, 'CREATE UNIQUE INDEX `IDX_orders_idempotencyKey` ON `orders` (`idempotencyKey`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
