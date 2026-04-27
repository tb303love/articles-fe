import {Directive, ElementRef, HostBinding, inject, input, OnDestroy, OnInit, output,} from '@angular/core';
import {fromEvent, merge, Subscription, timer} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';

@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef).nativeElement;

  duration = input<number>(1000);
  onLongPress = output<void>();

  @HostBinding('style.--press-p') progressPercent = '0%';
  private sub = new Subscription();

  ngOnInit() {
    const element = this.el; // inject(ElementRef).nativeElement

    // Svi načini da pokrenemo "štampu" (Miš, Touch, Space taster)
    const start$ = merge(
      fromEvent(element, 'mousedown'),
      fromEvent(element, 'touchstart'),
      fromEvent(element, 'keydown').pipe(
        filter((e: any) => e.code === 'Space' && !e.repeat), // Samo prvi pritisak Space-a
      ),
    );

    // Svi načini da prekinemo (Puštanje miša, pomeranje miša, puštanje tastera)
    const stop$ = merge(
      fromEvent(window, 'mouseup'),
      fromEvent(window, 'touchend'),
      fromEvent(element, 'mouseleave'),
      fromEvent(element, 'keyup').pipe(filter((e: any) => e.code === 'Space')),
    );

    this.sub = start$
      .pipe(
        switchMap((event) => {
          // Ako je taster u pitanju, sprečavamo skrolovanje stranice
          if (event instanceof KeyboardEvent) {
            event.preventDefault();
          }

          const startTime = Date.now();
          const currentDuration = this.duration();

          return timer(0, 30).pipe(
            map(() => Math.min(((Date.now() - startTime) / currentDuration) * 100, 100)),
            tap((p) => this.updateProgress(p)),
            filter((p) => p >= 100),
            take(1),
            tap(() => {
              this.onLongPress.emit();
              this.updateProgress(0);
            }),
            takeUntil(stop$),
          );
        }),
      )
      .subscribe();

    // KLJUČNI DEO: Resetuj progres čim se prekine pritisak
    const resetSub = stop$.subscribe(() => {
      this.updateProgress(0);
    });
    this.sub.add(resetSub);
  }

  private updateProgress(value: number) {
    this.el.style.setProperty('--press-p', `${value}%`);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
