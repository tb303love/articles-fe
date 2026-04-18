import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface WriteOffWarningData {
  affectedBundles: string[];
  stockQuantity: number;
}

@Component({
  selector: 'app-stock-write-off-warning-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="warning-title">
      <mat-icon color="warn">warning</mat-icon>
      Potvrda otpisa zaliha
    </h2>
    
    <mat-dialog-content>
      <p>Da li ste sigurni da želite da trajno otpišete <strong>{{ data.stockQuantity }} kom</strong> iz ove serije?</p>

      @if (data.affectedBundles.length > 0) {
        <div class="affected-section">
          <p class="warning-text">Brisanje ovih zaliha direktno utiče na dostupnost sledećih paketa:</p>
          <ul class="bundle-list">
            @for (bundleName of data.affectedBundles; track bundleName) {
              <li>{{ bundleName }}</li>
            }
          </ul>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">ODUSTANI</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">
        POTVRDI OTPIS
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #d32f2f;
    }
    .affected-section {
      margin-top: 20px;
      padding: 12px;
      background-color: #fff3f3;
      border-left: 4px solid #d32f2f;
      border-radius: 4px;
    }
    .warning-text {
      font-weight: 500;
      color: #b71c1c;
      margin-bottom: 8px;
    }
    .bundle-list {
      margin: 0;
      padding-left: 20px;
      li { font-weight: bold; }
    }
  `]
})
export class StockWriteOffWarningDialog {
  protected readonly data: WriteOffWarningData = inject(MAT_DIALOG_DATA);
}
