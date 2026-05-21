// barcode.service.ts
import {inject, Injectable} from '@angular/core';
import {WebSocketService} from './web-socket.service';
import {InventoryUpdate, NewInventoryScan} from '../model/barcode.model';
import {BehaviorSubject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class BarcodeService {
  private readonly wsService = inject(WebSocketService);
  private isOpenModal = new BehaviorSubject<boolean>(false);

  setIsOpenModal(isOpen: boolean) {
    this.isOpenModal.next(isOpen);
  }

  getIsOpenModal() {
    return this.isOpenModal.asObservable();
  }

  salesScans$ = this.wsService.watchTopic<string>('sales');
  inventoryScans$ = this.wsService.watchTopic<InventoryUpdate>('inventory');
  newArticle$ = this.wsService.watchTopic<NewInventoryScan>('new-article');
  info$ = this.wsService.watchTopic<string>('info');
}
