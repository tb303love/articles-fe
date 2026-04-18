import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { OrderType } from '../model';

export interface StockUpdate {
  items: { articleId: number; quantity: number }[];
  type: OrderType;
}

@Injectable({ providedIn: 'root' })
export class StockSyncService {
  // Neutralni stream koji niko ne uvozi u konstruktoru stora
  private stockUpdateSubject = new Subject<void>();
  stockUpdate$ = this.stockUpdateSubject.asObservable();

  notifyStockChanges() {
    this.stockUpdateSubject.next();
  }
}
