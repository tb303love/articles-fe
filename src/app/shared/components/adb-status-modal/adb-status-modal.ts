import { Component, inject } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';
import { MatDialogContent } from '@angular/material/dialog';
import { AdbConnectionService } from '../../../core/services/adb-connection.service';

@Component({
  selector: 'app-adb-status-modal', // Promenjen selektor
  standalone: true,
  imports: [MatProgressBar, MatIcon, MatDialogContent],
  templateUrl: './adb-status-modal.html',
  styleUrl: './adb-status-modal.scss',
})
export class AdbStatusModal {
  private adbService = inject(AdbConnectionService);

  // Direktno vezivanje na signale iz servisa
  protected mode = this.adbService.adbStatus;
  protected progressMessage = this.adbService.progressMessage;
}
