import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, map, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

// Ove varijable moraju biti VAN funkcije da bi bile zajedničke za sve pozive
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const unautorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
          return throwError(() => error);
        }

        // Ako je refresh VEĆ U TOKU, nemoj okidati novi
        if (isRefreshing) {
          // "Zaledi" ovaj zahtev dok subjekt ne dobije novi token
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => {
              const clonedReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
              return next(clonedReq);
            }),
          );
        }

        // Ako NIJE u toku, pokreni refresh
        isRefreshing = true;
        refreshTokenSubject.next(null); // Resetujemo subjekt

        return authService.refreshToken().pipe(
          switchMap((res) => {
            isRefreshing = false;
            refreshTokenSubject.next(res.accessToken); // "Budimo" sve zahteve koji čekaju

            const clonedRequest = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(clonedRequest);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            authService.logout();
            return throwError(() => refreshError).pipe(
              map(() => router.navigate(['/login'])),
              map(() => refreshError)
            );
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
