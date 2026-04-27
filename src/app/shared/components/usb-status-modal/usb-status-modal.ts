import {Component} from '@angular/core';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatIcon} from '@angular/material/icon';
import {MatDialogContent} from '@angular/material/dialog';

@Component({
  selector: 'app-usb-status-modal',
  imports: [
    MatProgressBar,
    MatIcon,
    MatDialogContent
  ],
  templateUrl: './usb-status-modal.html',
  styleUrl: './usb-status-modal.scss',
})
export class UsbStatusModal {

}
