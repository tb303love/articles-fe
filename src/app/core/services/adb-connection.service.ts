import {computed, inject, Injectable, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {WebSocketService} from './web-socket.service';
import {AdbStatusModal} from '../../shared/components/adb-status-modal/adb-status-modal';

// Mapirano prema novom Java enumu
export type AdbMode = 'DISCONNECTED' | 'USB_CONNECTED' | 'USB_UNAUTHORIZED';

@Injectable({providedIn: 'root'})
export class AdbConnectionService {
  private dialog = inject(MatDialog);
  private wsService = inject(WebSocketService);
  private dialogRef: MatDialogRef<AdbStatusModal> | null = null;

  private _currentMode = signal<AdbMode | null>(null);
  private _progressMessage = signal<string>('Čekam USB konekciju...');

  public adbStatus = computed(() => this._currentMode());
  public progressMessage = computed(() => this._progressMessage());

  constructor() {
    this.initWebSocketListeners();
  }

  private initWebSocketListeners() {
    // 1. Slušamo promenu stanja
    this.wsService.watchTopic('/topic/connection-mode').subscribe(mode => {
      const newMode = mode as AdbMode;
      this._currentMode.set(newMode);

      if (newMode === 'USB_CONNECTED') {
        // Ako je USB spojen i tunel postavljen, sklanjamo modal
        this.closeBlockingDialog();
      } else {
        // Za DISCONNECTED ili UNAUTHORIZED, modal mora da stoji
        this.openBlockingDialog();
      }
    });

    // 2. Slušamo poruke o progresu (Opis greške ili statusa)
    this.wsService.watchTopic('/topic/adb-progress').subscribe(msg => {
      this._progressMessage.set(msg as string);
    });
  }

  private openBlockingDialog() {
    if (this.dialogRef) return;

    this.dialogRef = this.dialog.open(AdbStatusModal, {
      disableClose: true,
      panelClass: 'adb-status-dialog',
      width: '380px', // Može i malo uži jer je manje teksta
    });
  }

  private closeBlockingDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }
}
