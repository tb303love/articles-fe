import {Component, DOCUMENT, effect, inject, Renderer2} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Navigation} from './navigation/navigation';
import {AdbConnectionService} from './core/services/adb-connection.service';
import {WebglScreenSaver} from './webgl-screen-saver/webgl-screen-saver';
import {Screensaver} from './core/services/scren-saver';
import {BarcodeService} from './core/services/barcode.service';
import {mergeMap, withLatestFrom} from 'rxjs/operators';
import {filter} from 'rxjs';
import {SnackbarService} from './core/services/snackbar-service';

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
  private readonly snackbarService = inject(SnackbarService);

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

    this.barcodeService.salesScans$.pipe(
      mergeMap((barcode) => this.router.navigate(['/prodaja'], {
        queryParams: {
          barcode,
          t: new Date().getTime()
        },
        queryParamsHandling: 'merge'
      }))
    ).subscribe();

    this.barcodeService.inventoryScans$.pipe(
      withLatestFrom(this.barcodeService.getIsOpenModal()),
      filter(isOpened => !isOpened),
      mergeMap(([inventory]) => this.router.navigate([`/artikli/${inventory.article.id}`], {
        queryParams: {
          newArticle: false,
          t: new Date().getTime()
        },
        queryParamsHandling: 'merge',
        state: {
          article: inventory.article,
          stock: inventory.stock,
        },
      }))
    ).subscribe();

    this.barcodeService.newArticle$.pipe(
      withLatestFrom(this.barcodeService.getIsOpenModal()),
      filter(isOpened => !isOpened),
      mergeMap(([stock]) => this.router.navigate([`/artikli/new`], {
        queryParams: {
          newArticle: true,
          t: new Date().getTime()
        },
        queryParamsHandling: 'merge',
        state: {
          article: null,
          newArticle: true,
          stock,
        },
      }))
    ).subscribe();

    this.barcodeService.info$.subscribe(message => this.snackbarService.openSnackBar(message, "Greska"));
  }
}
