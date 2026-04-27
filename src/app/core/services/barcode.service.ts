// barcode.service.ts
import {inject, Injectable} from '@angular/core';
import {WebSocketService} from './web-socket.service';

@Injectable({providedIn: 'root'})
export class BarcodeService {
  private readonly wsService = inject(WebSocketService);

  // public inventoryScans$ = this.wsService.watchTopic('/topic/inventory');
  public salesScans$ = this.wsService.watchTopic('/topic/sales');

}
