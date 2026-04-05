import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Proveravamo computed signal za admin ulogu
  if (authService.isAdmin()) {
    return true;
  }

  // Ako nije admin, vraćamo ga na login ili neku "unauthorized" stranu
  return router.parseUrl('/prodaja');
};
