import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {BehaviorSubject, catchError, filter, switchMap, take, throwError} from 'rxjs';
import {AuthService} from '../services/auth-service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const unautorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      // Reagujemo samo na 401 i 403
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {

        // Ako je greška pukla na login-u ili samom osvežavanju, nemoj upadati u petlju
        if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
          return throwError(() => error);
        }

        // Ako je refresh VEĆ U TOKU, čekamo novi token unutar BehaviorSubject-a
        if (isRefreshing) {
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => {
              const clonedReq = req.clone({setHeaders: {Authorization: `Bearer ${token}`}});
              return next(clonedReq);
            }),
          );
        }

        // Pokrećemo proces osvežavanja
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap((res) => {
            isRefreshing = false;
            refreshTokenSubject.next(res.accessToken); // Probuđeni su svi zahtevi na čekanju

            const clonedRequest = req.clone({
              setHeaders: {Authorization: `Bearer ${res.accessToken}`},
            });
            return next(clonedRequest);
          }),
          catchError((refreshError) => {
            // OVDE DOLAZI GREŠKA KADA JE REFRESH TOKEN ISTEKAO (Tvoj 401 sa Spring-a)
            isRefreshing = false;
            refreshTokenSubject.next(null); // Resetujemo za sledeći put

            // Koristimo javnu metodu koja čisti Signale, LocalStorage i radi ruter navigaciju
            authService.clearSession();

            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
