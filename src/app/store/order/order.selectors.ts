import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import { Order } from '../../core/model';
import { OrderState } from './order.state';

// Pomoćna funkcija: sada je jasnija jer storno uvek pokriva 100% količine
const isFullyRefunded = (order: Order): boolean => {
  if (!order.items?.length) return false;
  // Po zakonu, stornirana stavka mora imati identičnu količinu kao kupljena
  return order.items.every((item) => item.refundedQuantity >= item.quantity);
};

export function withOrderSelectors() {
  return signalStoreFeature(
    { state: type<OrderState>() },
    withComputed((state) => ({
      // Ukupan broj storniranih računa danas
      totalRefunds: computed(() => state.totalDailySales().totalRefunds || 0),

      // UI hint za dashboard
      hasRefundsToday: computed(() => (state.totalDailySales().totalRefunds || 0) > 0),

      // Broj aktivnih (nestorniranih) računa - bitno za "Live" prikaz
      activeCount: computed(() => state.orders().filter((o) => !isFullyRefunded(o)).length),

      // Neto pazar (Prodaja - Storno)
      netDailySales: computed(() => state.totalDailySales().netRevenue),

      grossRetail: computed(() => state.totalDailySales().grossRetail),

      // Glavna logika za prikaz liste na ekranu
      filteredOrders: computed(() => {
        const filter = state.filterStatus();
        const allOrders = state.orders();

        switch (filter) {
          case 'ACTIVE':
            return allOrders.filter((o) => !isFullyRefunded(o));

          case 'WHOLESALE':
            return allOrders.filter((o) => o.type === 'WHOLESALE' && !isFullyRefunded(o));

          case 'RETAIL':
            // Prikazujemo samo Maloprodaju koja NIJE stornirana
            return allOrders.filter((o) => o.type === 'RETAIL' && !isFullyRefunded(o));

          case 'REFUNDED':
            return allOrders.filter((o) => isFullyRefunded(o));

          default:
            return allOrders;
        }
      }),
    })),
  );
}
