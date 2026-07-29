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

export interface LikeCardOrder {
  orderId: string;
  referenceId: string;
  productId: string;
  status: string;
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
