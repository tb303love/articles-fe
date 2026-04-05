import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-import-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './import-confirm-dialog.html',
  styleUrl: './import-confirm-dialog.scss',
})
export class ImportConfirmDialog {
  // Inject podataka iz FileBrowser-a (stats i fileName)
  protected readonly data = inject(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ImportConfirmDialog>);
}
