import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Proveravamo signal iz servisa
  if (authService.isAuthenticated()) {
    return true;
  }

  // Umesto ručnog .navigate(), vraćamo UrlTree koji vodi na login
  return router.parseUrl('/login');
};
