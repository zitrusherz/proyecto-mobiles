import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

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
