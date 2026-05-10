import {Injectable, signal} from '@angular/core';
import {fromEvent, merge, timer} from 'rxjs';
import {switchMap, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Screensaver {
  // Koristimo Signal za lako praćenje stanja u komponentama
  isIdle = signal<boolean>(false);
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minuta

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Događaji koji resetuju tajmer
    const interaction$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'mousedown'),
      fromEvent(window, 'touchstart')
    );

    interaction$.pipe(
      // Kada god se desi interakcija, "ugasimo" screensaver (ako je bio upaljen)
      tap(() => {
        if (this.isIdle()) this.isIdle.set(false);
      }),
      // switchMap resetuje tajmer pri svakoj interakciji
      switchMap(() => timer(this.TIMEOUT_MS)),
      tap(() => {
        this.isIdle.set(true);
      })
    ).subscribe();
  }
}
