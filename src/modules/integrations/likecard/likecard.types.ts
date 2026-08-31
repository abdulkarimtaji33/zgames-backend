export interface LikeCardEnvelope<T> {
  response: 0 | 1;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

/** check_balance's real response has no `data` wrapper — fields sit at the top level alongside `response`. */
export interface LikeCardBalance {
  userId: string;
  balance: string | number;
  currency?: string;
}

/**
 * Real field names confirmed against a live categories response — differ from the docs'
 * generic description (categoryName/categoryParentId/childs, not name/parentId/children).
 */
export interface LikeCardCategory {
  id: string;
  categoryName: string;
  categoryParentId?: string;
  childs?: LikeCardCategory[];
  [key: string]: unknown;
}

/**
 * Real field names confirmed against a live products response. productPrice is the wholesale
 * cost LikeCard charges us (there is no separate costPrice field); sellPrice is LikeCard's own
 * suggested resale price, which we intentionally ignore in favor of our own configured markup.
 * productImageWhiteLabel is a branding-free image variant — always prefer it over productImage
 * for anything customer-facing, per the white-label requirement.
 */
export interface LikeCardProduct {
  productId: string;
  categoryId: string;
  productName: string;
  productPrice: number;
  productCurrency: string;
  available: boolean;
  productImage?: string;
  productImageWhiteLabel?: string;
  sellPrice?: string;
  expiryInMonth?: string;
  [key: string]: unknown;
}

/**
 * A single delivered unit. serialCode is the field that actually carries the redeemable code (confirmed
 * against a live create_order response) — it is base64-encoded and may be further encoded/encrypted by
 * LikeCard beyond that; the exact scheme isn't documented anywhere in this codebase, so treat the decoded
 * value as unconfirmed until checked against LikeCard's docs or support.
 */
export interface LikeCardSerial {
  serialId?: string;
  serialCode?: string;
  serialNumber?: string;
  serialBarcode?: string;
  validTo?: string;
  [key: string]: unknown;
}

export interface LikeCardOrder {
  orderId: string;
  referenceId: string;
  productId: string;
  status: string;
  /** Real create_order/orders-details responses deliver units under `serials`, not `codes` — `codes` has
   *  never been observed on a live response and is kept only in case some other endpoint uses it. */
  serials?: LikeCardSerial[];
  codes?: string[];
  [key: string]: unknown;
}

export interface ListOrdersOptions {
  page?: number;
  orderType?: 'asc' | 'desc';
  fromUnixTime?: number;
  toUnixTime?: number;
}

export interface GetOrderDetailsOptions {
  orderId?: string;
  referenceId?: string;
}
