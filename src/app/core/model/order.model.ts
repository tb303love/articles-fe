import { Refund } from "./refund.model";

export enum OrderType {
  WHOLESALE = 'WHOLESALE',
  RETAIL = 'RETAIL',
  REFUND = 'REFUND',
}

export interface OrderItem {
  id: number;
  articleName: string; // article_name_snapshot sa bekenda
  priceAtSale: number; // price_at_sale
  quantity: number;
  articleId: number;
  refundedQuantity: number;
  availableToRefund: number;
}

export interface Order {
  id: number;
  type: 'RETAIL' | 'WHOLESALE';
  createdAt: string;
  totalAmount: number;
  items: OrderItem[];
  refunds: Refund[];
}

export type OrderRequest = {
  type: OrderType;
  isGratis: boolean;
  items: {
    articleId: number;
    quantity: number;
  }[];
};

export type OrderRefundRequest = {
  type: OrderType;
  items: {
    articleId: number;
    orderArticleId: number;
    quantity: number;
  }[];
};

export interface RevenueSummary {
  grossRetail: number; // Bruto maloprodaja
  grossWholesale: number; // Bruto veleprodaja
  totalRefunds: number; // Ukupno vraćen novac (parcijalni + celi)
  netRevenue: number;
}
