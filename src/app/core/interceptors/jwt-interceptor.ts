import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth-service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService); // Inject unutar funkcije
  const token = authService.getAccessToken();
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Dodajemo token samo ako postoji i ako zahtev ide ka tvom API-ju
  if (token && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
