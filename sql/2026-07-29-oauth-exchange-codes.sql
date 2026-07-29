-- New table for the OAuth exchange-code fix (short-lived, single-use code exchanged for real
-- tokens instead of putting access/refresh tokens directly in the OAuth redirect URL).
-- Run this against the target database before deploying this code (TYPEORM_SYNCHRONIZE=false).

CREATE TABLE IF NOT EXISTS `oauth_exchange_codes` (
  `id` varchar(36) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) NULL,
  `code` varchar(64) NOT NULL,
  `accessToken` text NOT NULL,
  `refreshToken` text NOT NULL,
  `expiresIn` int NOT NULL,
  `expiresAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_oauth_exchange_codes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
