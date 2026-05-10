import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Navigation} from './navigation/navigation';
import {AdbConnectionService} from './core/services/adb-connection.service';
import {WebglScreenSaver} from './webgl-screen-saver/webgl-screen-saver';
import {Screensaver} from './core/services/scren-saver';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, WebglScreenSaver],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly usbCableService = inject(AdbConnectionService);
  protected ssService = inject(Screensaver);
}
