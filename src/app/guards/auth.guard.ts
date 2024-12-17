import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    map((isAuthenticated) => {
      const isPublicRoute = route.data['public'] || false;
      const isQrPage = route.url.some((segment) => segment.path === 'qr');

      if (isQrPage && !isAuthenticated) {
        router.navigate(['/login']);
        return false;
      }

      if (isAuthenticated && isPublicRoute) {
        router.navigate(['/home']);
        return false;
      }

      if (!isAuthenticated && !isPublicRoute) {
        router.navigate(['/login']);
        return false;
      }

      return true;
    })
  );
};
