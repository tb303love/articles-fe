import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patchState, signalStoreFeature, type, withMethods } from '@ngrx/signals';
import { forkJoin, Subject, switchMap, tap } from 'rxjs';
import { Order, OrderRequest, OrderType } from '../../core/model';
import { RefundService } from '../../core/services/refund.service';
import { SalesService } from '../../core/services/sales-service';
import { StockSyncService } from '../../core/services/stock-sync-service';
import { OrderState } from './order.state';

export function withOrderMethods() {
  const refundSuccessSubject = new Subject<void>();
  return signalStoreFeature(
    { state: type<OrderState>() },
    withMethods(
      (
        state,
        salesService = inject(SalesService),
        refundService = inject(RefundService),
        stockSync = inject(StockSyncService),
        snackBar = inject(MatSnackBar),
      ) => ({
        generateReport() {
          return salesService.sendTestReport().subscribe();
        },
        generateMonthlyReport() {
          return salesService.sendTestMonthlyReport().subscribe();
        },
        processRefundSuccess() {
          return refundSuccessSubject.asObservable();
        },
        updateFilter(status: 'ALL' | 'ACTIVE' | 'REFUNDED') {
          patchState(state, { filterStatus: status });
        },

        /**
         * Kreira novu porudžbinu i osvežava stanje zaliha i pazara
         */
        createOrder(orderRequest: OrderRequest) {
          patchState(state, { isLoading: true });

          salesService
            .placeOrder(orderRequest)
            .pipe(
              switchMap(() =>
                forkJoin({
                  orders: salesService.fetchTodayOrders(),
                  revenue: salesService.getTodayRevenue(),
                }),
              ),
            )
            .subscribe({
              next: ({ orders, revenue }) => {
                patchState(state, {
                  orders: orders,
                  totalDailySales: revenue,
                  isLoading: false,
                });
                stockSync.notifyStockChanges();
                snackBar.open('Porudžbina uspešno kreirana!', 'OK', { duration: 3000 });
              },
              error: (err) => {
                console.error('Greška:', err);
                snackBar.open('Greška pri kreiranju porudžbine', 'Zatvori');
                patchState(state, { isLoading: false });
              },
            });
        },

        /**
         * Dobavlja sve današnje porudžbine
         */
        getTodayOrders() {
          patchState(state, { isLoading: true });
          return salesService.fetchTodayOrders().subscribe({
            next: (orders) => {
              patchState(state, { orders, isLoading: false });
            },
            error: () => patchState(state, { isLoading: false }),
          });
        },

        /**
         * Menja tip porudžbine (Retail <-> Wholesale)
         */
        toggleOrderType(order: Order) {
          const newType: OrderType =
            order.type === OrderType.RETAIL ? OrderType.WHOLESALE : OrderType.RETAIL;

          salesService
            .updateOrderType(order.id!, newType)
            .pipe(
              tap((updatedOrder) => {
                patchState(state, (currentState: any) => ({
                  orders: currentState.orders.map((o: Order) =>
                    o.id === updatedOrder.id ? updatedOrder : o,
                  ),
                }));
              }),
              switchMap(() =>
                forkJoin([salesService.fetchTodayOrders(), salesService.getTodayRevenue()]),
              ),
            )
            .subscribe({
              next: ([orders, revenue]) => {
                patchState(state, { orders, totalDailySales: revenue });
              },
              error: (err) => {
                console.error('Greška pri ažuriranju tipa:', err);
                snackBar.open('Greška pri promeni tipa porudžbine', 'Zatvori');
              },
            });
        },

        /**
         * Osvežava današnji pazar (revenue)
         */
        getTodayRevenue() {
          return salesService.getTodayRevenue().subscribe((revenue) => {
            patchState(state, { totalDailySales: revenue });
          });
        },

        /**
         * Vrši totalni storno računa (100% refundacija)
         * U skladu sa zakonom o e-fiskalizaciji u Srbiji.
         */
        processRefund(orderId: number) {
          patchState(state, { isLoading: true });

          // Šaljemo samo ID, backend preuzima svu logiku totalnog storna
          refundService
            .processRefund(orderId)
            .pipe(
              switchMap(() =>
                forkJoin({
                  orders: salesService.fetchTodayOrders(),
                  revenue: salesService.getTodayRevenue(),
                }),
              ),
            )
            .subscribe({
              next: ({ orders, revenue }) => {
                patchState(state, {
                  orders,
                  totalDailySales: revenue,
                  isLoading: false,
                });
                stockSync.notifyStockChanges();
                refundSuccessSubject.next();
                snackBar.open('Račun uspešno storniran!', 'OK', { duration: 3000 });
              },
              error: (err) => {
                // Prikazujemo poruku o grešci direktno sa backenda (npr. "Već stornirano")
                const msg = err.error?.message || 'Greška pri storniranju računa!';
                snackBar.open(msg, 'Zatvori', { duration: 5000 });
                patchState(state, { isLoading: false });
              },
            });
        },
      }),
    ),
  );
}
