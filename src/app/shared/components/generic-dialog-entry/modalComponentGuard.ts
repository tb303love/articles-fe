import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const modalComponentGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const modalComponent = route.data?.['modalComponent'];

  if (!modalComponent) {
    console.error(
      `[Guard Error]: Ruta "${state.url}" zahteva "modalComponent" unutar data objekta.`
    );

    // Možete vratiti 'false' ili preusmeriti korisnika na roditeljsku rutu
    // U zavisnosti od URL-a, ovde primoravamo povratak na nivo iznad
    const parentUrl = state.url.split('/').slice(0, -1).join('/') || '/';
    return router.parseUrl(parentUrl);
  }

  return true;
};
