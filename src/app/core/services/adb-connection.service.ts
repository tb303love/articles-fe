import {computed, inject, Injectable, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {WebSocketService} from './web-socket.service';
import {AdbStatusModal} from '../../shared/components';
import {EMPTY, switchMap} from 'rxjs';
import {tap} from 'rxjs/operators';
import {getRouteEnd$} from '../utils/getRouteEnd';

export type AdbMode = 'DISCONNECTED' | 'USB_CONNECTED' | 'USB_UNAUTHORIZED' | null;

@Injectable({providedIn: 'root'})
export class AdbConnectionService {
  private dialog = inject(MatDialog);
  private wsService = inject(WebSocketService);
  private dialogRef: MatDialogRef<AdbStatusModal> | null = null;

  private _currentMode = signal<AdbMode | null>(null);
  private _progressMessage = signal<string>('Čekam USB konekciju...');

  adbStatus = computed(() => this._currentMode());
  progressMessage = computed(() => this._progressMessage());

  constructor() {
    this.initWebSocketListeners();
  }

  private initWebSocketListeners() {

    getRouteEnd$().pipe(
      switchMap((currentUrl) => {
        const isLoginPage = currentUrl === '/login';

        if (isLoginPage) {
          // Ako smo na loginu, gasimo dijalog i vraćamo prazan tok
          // switchMap će automatski uraditi unsubscribe sa web socketa ako je bio aktivan
          this.closeBlockingDialog();
          return EMPTY;
        }

        // Ako NISMO na loginu, aktiviramo slušanje Web Socketa
        return this.wsService.watchTopic<AdbMode>('connection-mode').pipe(
          tap((mode) => {
            this._currentMode.set(mode);

            if (mode === 'USB_CONNECTED') {
              this.closeBlockingDialog();
            } else {
              this.openBlockingDialog();
            }
          })
        );
      })
    ).subscribe();

    // Progres ostaje odvojen
    this.wsService.watchTopic<string>('adb-progress').subscribe(msg => {
      this._progressMessage.set(msg);
    });
  }

  private openBlockingDialog() {
    if (this.dialogRef) return;

    this.dialogRef = this.dialog.open(AdbStatusModal, {
      disableClose: true,
      panelClass: 'adb-status-dialog',
      width: '380px',
    });
  }

  private closeBlockingDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }
}
