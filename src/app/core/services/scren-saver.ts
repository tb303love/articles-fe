import {inject, Injectable, signal} from '@angular/core';
import {EMPTY, fromEvent, merge, startWith, timer} from 'rxjs';
import {switchMap, tap} from 'rxjs/operators';
import {toObservable} from '@angular/core/rxjs-interop';
import {AdbConnectionService} from './adb-connection.service';
import {getRouteEnd$} from '../utils/getRouteEnd';

@Injectable({
  providedIn: 'root'
})
export class Screensaver {
  // Koristimo Signal za lako praćenje stanja u komponentama
  isIdle = signal<boolean>(false);
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minuta
  private readonly adbConnectionService = inject(AdbConnectionService);

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // 1. Primarni izvor je promena rute koja nam daje trenutni URL string
    const adbStatus$ = toObservable(this.adbConnectionService.adbStatus);

    const interaction$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'mousedown'),
      fromEvent(window, 'touchstart')
    );

    getRouteEnd$().pipe(
      switchMap((currentUrl) => {
        const isLoginPage = currentUrl === '/login';

        if (isLoginPage) {
          this.isIdle.set(false);
          return EMPTY; // Ako smo na loginu, odmah otkazujemo sve unutrašnje tokove
        }

        // 2. Ako NISMO na loginu, unutar switchMap-a slušamo promene ADB statusa
        return adbStatus$.pipe(
          switchMap((status) => {
            const isConnected = status === null || status === 'USB_CONNECTED';

            if (!isConnected) {
              this.isIdle.set(false);
              return EMPTY; // Ako skener nije tu, praćenje miruje
            }

            // 3. Tek kada smo ulogovani I skener je tu, aktiviramo praćenje miša i tastature
            return interaction$.pipe(
              startWith(null),
              tap(() => {
                if (this.isIdle()) {
                  this.isIdle.set(false);
                }
              }),
              switchMap(() => timer(this.TIMEOUT_MS)),
              tap(() => {
                this.isIdle.set(true);
              })
            );
          })
        );
      })
    ).subscribe();
  }

}
