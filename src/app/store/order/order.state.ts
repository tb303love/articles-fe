import { Order, RevenueSummary } from '../../core/model';
export type SalesOrderType = 'ALL' | 'ACTIVE' | 'REFUNDED' | 'RETAIL' | 'WHOLESALE'
export interface OrderState {
  orders: Order[];
  isLoading: boolean;
  totalDailySales: RevenueSummary;
  filterStatus: SalesOrderType ;
}

export const initialState: OrderState = {
  orders: [],
  isLoading: false,
  totalDailySales: { grossRetail: 0, grossWholesale: 0, totalRefunds: 0, netRevenue: 0 },
  filterStatus: 'ALL',
};
