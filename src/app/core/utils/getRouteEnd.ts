import { inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

/**
 * Helper funkcija koja vraća Observable trenutne rute.
 * Emituje trenutni URL odmah pri pretplati, kao i nakon svake uspešne navigacije.
 */
export function getRouteEnd$(): Observable<string> {
  const router = inject(Router);

  return router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    // Mapiramo direktno na string (URL) radi lakšeg korišćenja
    map((event: NavigationEnd) => event.urlAfterRedirects),
    // Pokrećemo tok odmah sa trenutnim URL-om pre nego što se desi sledeća navigacija
    startWith(router.url)
  );
}
