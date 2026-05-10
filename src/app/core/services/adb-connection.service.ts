import {computed, inject, Injectable, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {WebSocketService} from './web-socket.service';
import {AdbStatusModal} from '../../shared/components/adb-status-modal/adb-status-modal';

// Tačno mapiranje Java AdbState enuma
export type AdbMode =

  | 'DISCONNECTED'
  | 'WIFI'
  | 'USB_CONNECTED_WAITING_WIFI'

  | 'USB_UNAUTHORIZED'
  | 'ACTIVATING_WIRELESS';

@Injectable({providedIn: 'root'})
export class AdbConnectionService {
  private dialog = inject(MatDialog);
  private wsService = inject(WebSocketService);
  private dialogRef: MatDialogRef<AdbStatusModal> | null = null;

  // Signali za reaktivni UI
  private _currentMode = signal<AdbMode | null>(null);
  private _progressMessage = signal<string>('Inicijalizacija ADB provere...');

  // Javni computed podaci (Read-only za komponente)
  public adbStatus = computed(() => this._currentMode());
  public progressMessage = computed(() => this._progressMessage());

  constructor() {
    this.initWebSocketListeners();
  }

  private initWebSocketListeners() {
    // 1. Slušamo promenu stanja (Semafor)
    this.wsService.watchTopic('/topic/connection-mode').subscribe(mode => {
      const newMode = mode as AdbMode;
      this._currentMode.set(newMode);

      if (newMode === 'WIFI') {
        // Ako smo na WIFI, sačekaćemo potvrdu kroz progress poruku za zatvaranje
      } else {
        // Za sve ostalo (greške, USB, diskonekcija), osiguraj da je dijalog otvoren
        this.openBlockingDialog();
      }
    });

    // 2. Slušamo poruke o progresu (Heartbeat sa Backenda)
    this.wsService.watchTopic('/topic/adb-progress').subscribe(msg => {
      const message = msg as string;
      this._progressMessage.set(message);

      // Logika za zatvaranje dijaloga samo kada je status stabilan (WIFI)
      if (this._currentMode() === 'WIFI') {
        setTimeout(() => {
          // Proveravamo da li smo i dalje na WIFI pre nego što stvarno zatvorimo
          if (this._currentMode() === 'WIFI') {
            this.closeBlockingDialog();
          }
        }, 2000);
      } else {
        // Dokle god pulsira bilo šta što nije WIFI, modal mora biti tu
        this.openBlockingDialog();
      }
    });
  }

  /**
   * Otvara modal koji blokira interakciju dok se ne uspostavi ADB veza.
   */
  private openBlockingDialog() {
    // Sprečavamo višestruko otvaranje ako je već otvoren
    if (this.dialogRef) return;

    this.dialogRef = this.dialog.open(AdbStatusModal, {
      disableClose: true, // Korisnik ne može da ugasi na ESC ili klik sa strane
      panelClass: 'adb-status-dialog',
      width: '420px',
      // Podaci se u komponenti vuku direktno inject-ovanjem ovog servisa
    });
  }

  /**
   * Zatvara modal i oslobađa referencu.
   */
  private closeBlockingDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }
}
