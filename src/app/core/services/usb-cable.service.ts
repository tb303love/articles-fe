import {inject, Injectable} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {WebSocketService} from './web-socket.service';
import {map, startWith} from 'rxjs/operators'
import {UsbStatusModal} from '../../shared/components/usb-status-modal/usb-status-modal';

@Injectable({providedIn: 'root'})
export class UsbCableService {
  private dialog = inject(MatDialog);
  private wsService = inject(WebSocketService);
  private dialogRef: MatDialogRef<UsbStatusModal> | null = null;

  constructor() {
    this.wsService.watchTopic('/topic/usb-status').pipe(
      map(status => status === true || status === 'true'),
      startWith(true)
    ).subscribe(isConnected => {
      if (!isConnected) {
        this.openBlockingDialog();
      } else {
        this.closeBlockingDialog();
      }
    })
  }

  private openBlockingDialog() {
    if (!this.dialogRef) {
      this.dialogRef = this.dialog.open(UsbStatusModal, {
        disableClose: true, // Blokira ESC i klik van modala
        panelClass: 'usb-error-dialog',
        width: '400px'
      });
    }
  }

  private closeBlockingDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }
}
