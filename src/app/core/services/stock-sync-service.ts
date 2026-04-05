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
  private stockUpdateSubject = new Subject<StockUpdate>();
  stockUpdate$ = this.stockUpdateSubject.asObservable();

  notifyStockChanges(updates: StockUpdate) {
    this.stockUpdateSubject.next(updates);
  }
}
