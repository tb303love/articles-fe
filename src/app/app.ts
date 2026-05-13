import {Component, DOCUMENT, effect, inject, Renderer2} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Navigation} from './navigation/navigation';
import {AdbConnectionService} from './core/services/adb-connection.service';
import {WebglScreenSaver} from './webgl-screen-saver/webgl-screen-saver';
import {Screensaver} from './core/services/scren-saver';
import {BarcodeService} from './core/services/barcode.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, WebglScreenSaver],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly usbCableService = inject(AdbConnectionService);
  protected ssService = inject(Screensaver);
  private readonly isIdle = this.ssService.isIdle;
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly barcodeService = inject(BarcodeService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const running = this.isIdle();
      const body = this.document.body;

      if (running) {
        this.renderer.addClass(body, 'screensaver-active');
      } else {
        this.renderer.removeClass(body, 'screensaver-active');
      }
    });

    this.barcodeService.salesScans$.subscribe(barcode => {
      this.router.navigate(['/prodaja'], {
        queryParams: {
          barcode: barcode,
          t: Date.now() // Ključno za ponovljene skenove
        },
        queryParamsHandling: 'merge'
      });
    });
  }
}
