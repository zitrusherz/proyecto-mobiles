import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot,} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AuthService} from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      map((isAuthenticated) => {
        const isPublicRoute = route.data['public'] || false;
        const isQrPage = route.url.some((segment) => segment.path === 'qr');

        if (isQrPage && !isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        if (isAuthenticated && isPublicRoute) {
          this.router.navigate(['/home']);
          return false;
        }

        if (!isAuthenticated && !isPublicRoute) {
          this.router.navigate(['/login']);
          return false;
        }

        return true;
      })
    );
  }
}
