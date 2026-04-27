import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Navigation} from './navigation/navigation';
import {UsbCableService} from './core/services/usb-cable.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly usbCableService = inject(UsbCableService);
}
