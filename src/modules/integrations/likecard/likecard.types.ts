export interface LikeCardEnvelope<T> {
  response: 0 | 1;
  message: string;
  data: T | null;
}

export interface LikeCardBalance {
  userId: string;
  balance: number;
  currency?: string;
}

export interface LikeCardCategory {
  id: string;
  name: string;
  parentId?: string | null;
  children?: LikeCardCategory[];
}

export interface LikeCardProduct {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  currency: string;
  available?: boolean;
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
