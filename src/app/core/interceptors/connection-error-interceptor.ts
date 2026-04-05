import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';
import { SnackbarService } from '../services/snackbar-service';

export const connectionErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse) => {
        // Retry radimo samo ako je server stvarno "nedostupan" (0 ili Proxy 500)
        const isProxyError = error.status === 500 && (!error.error || error.error instanceof ProgressEvent);
        if (error.status === 0 || isProxyError) {
          return timer(1000); 
        }
        throw error; // Za sve ostale greške (401, 404, pravi 500) odmah idi na catchError
      },
    }),
    catchError((error: HttpErrorResponse) => {
      // Detekcija specifičnih stanja
      const isNoInternet = !navigator.onLine;
      const isProxyError = error.status === 500 && (!error.error || error.error instanceof ProgressEvent);
      const isServerDown = error.status === 0 || isProxyError;

      if (isNoInternet) {
        snackbar.openSnackBar('Nema internet veze', 'Proverite vašu mrežu.');
      } 
      else if (isServerDown) {
        // Ovde hvatamo tvoj ECONNREFUSED koji se maskira u 500 ili je 0
        snackbar.openSnackBar('Server nedostupan', 'Naš servis trenutno nije u funkciji. Pokušajte kasnije.');
      }

      return throwError(() => error);
    }),
  );
};
