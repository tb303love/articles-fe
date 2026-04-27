import {CommonModule} from '@angular/common';
import {Component, computed, inject, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Order} from '../core/model';
import {ConfirmDirective, LongPressDirective} from '../shared/directives';
import {OrderStore} from '../store/order/order.store';

@Component({
  selector: 'app-order-list-item',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    ConfirmDirective,
    MatProgressSpinnerModule,
    LongPressDirective
  ],
  templateUrl: './order-list-item.html',
  styleUrl: './order-list-item.scss',
})
export class OrderListItem {
  protected readonly orderStore = inject(OrderStore);
  order = input.required<Order>();

  isFullyRefunded = computed(() => {
    const o = this.order();
    if (!o.items || o.items.length === 0) return false;
    // Račun je storniran ako su sve stavke vraćene
    return o.items.every((i) => i.refundedQuantity === i.quantity);
  });
}
