import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinner, MatIconModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  protected readonly data: {
    title: string;
    message: string;
    positiveButtonLabel: string;
    isLoading: () => boolean;
    // Funkcija koja se poziva na klik "Yes"
    confirm: () => void;
  } = inject(MAT_DIALOG_DATA);
}
