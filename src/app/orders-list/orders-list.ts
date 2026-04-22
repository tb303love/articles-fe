import {CommonModule} from '@angular/common';
import {Component, inject, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatDrawer} from '@angular/material/sidenav';
import {OrderListItem} from '../order-list-item/order-list-item';
import {OrderStore} from '../store/order/order.store';
import {SalesTypePipe} from '../shared/pipes';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'app-orders-list',
  imports: [
    CommonModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatListModule,
    MatCardModule,
    OrderListItem,
    MatButtonToggleModule,
    SalesTypePipe,
    MatTooltip,
  ],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.scss',
})
export class OrdersList {
  protected readonly orderStore = inject(OrderStore);

  rightDrawer = input.required<MatDrawer>();
}
