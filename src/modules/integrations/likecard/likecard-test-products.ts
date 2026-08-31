/**
 * LikeCard-supplied test product IDs (per their team, 2026-08-26): safe to order against without
 * spending real wallet balance / real money. Used to gate the sandbox test-purchase endpoint so it
 * can never be pointed at a live production product by mistake.
 */
export const LIKECARD_TEST_PRODUCT_IDS: string[] = [
  '1311',
  '313',
  '359',
  '375',
  '693',
  '694',
  '819',
  '987',
  '1128',
  '295',
  '2114',
  '2115',
  '2116',
  '2118',
  '2119',
  '2196',
  '3098',
  '3099',
  '3100',
  '3101',
  '1753',
];

export function isLikeCardTestProductId(productId: string): boolean {
  return LIKECARD_TEST_PRODUCT_IDS.includes(productId);
}
