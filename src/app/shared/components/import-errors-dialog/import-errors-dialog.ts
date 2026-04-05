import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-import-errors-dialog',
  standalone: true,
  imports: [MatDialogModule, MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './import-errors-dialog.html',
  styles: [
    `
      .error-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #d32f2f;
        margin-bottom: 16px;
      }
      .table-container {
        max-height: 400px;
        overflow: auto;
        border: 1px solid #eee;
        border-radius: 8px;
      }
      .reasons-list {
        margin: 0;
        padding-left: 18px;
        color: #d32f2f;
        font-size: 0.85rem;
      }
      th.mat-mdc-header-cell {
        background: #fafafa;
        font-weight: bold;
        color: #333;
      }
      td.mat-mdc-cell {
        padding: 12px 8px;
        vertical-align: top;
      }
    `,
  ],
})
export class ImportErrorsDialog {
  // Inject podaci koji stižu iz servisa
  protected readonly data = inject(MAT_DIALOG_DATA);
  // Inject referenca na sam dijalog (ako zatreba za zatvaranje)
  protected readonly dialogRef = inject(MatDialogRef<ImportErrorsDialog>);

  displayedColumns: string[] = ['row', 'itemName', 'reasons'];
}
