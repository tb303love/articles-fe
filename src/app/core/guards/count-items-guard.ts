import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { ArticlesApiService } from '../services/articles-api-service';

// Prodaja ima smisla samo ako postoji bar jedan artikal - proveravamo na serveru u trenutku navigacije
export const countItemsGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
   const articleApi = inject(ArticlesApiService);
   const router = inject(Router);

   return articleApi.countArticles().pipe(
      map((count) => count > 0 || router.parseUrl('/artikli')),
      catchError(() => of(router.parseUrl('/artikli'))),
   );
};
