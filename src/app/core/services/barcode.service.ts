// barcode.service.ts
import {inject, Injectable} from '@angular/core';
import {WebSocketService} from './web-socket.service';
import {InventoryUpdate} from '../model/barcode.model';

@Injectable({providedIn: 'root'})
export class BarcodeService {
  private readonly wsService = inject(WebSocketService);

  salesScans$ = this.wsService.watchTopic<string>('/topic/sales');
  inventoryScans$ = this.wsService.watchTopic<InventoryUpdate>('/topic/inventory');

}
