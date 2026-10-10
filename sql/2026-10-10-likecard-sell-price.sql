-- Stores LikeCard's own suggested resale price (sellPrice field) alongside the wholesale cost
-- (costPrice, added in 2026-07-29-likecard-columns.sql) so the admin gift-card margin view can show
-- "LikeCard suggests X" next to "your cost Y" and "your price Z" without an extra live API call.
ALTER TABLE `products`
  ADD COLUMN `likecardSellPrice` DECIMAL(10,2) NULL AFTER `costPrice`;
