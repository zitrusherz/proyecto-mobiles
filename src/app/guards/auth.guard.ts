import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationStateService } from '../services/authentication-state.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authStateService: AuthenticationStateService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authStateService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          // Si no está autenticado, lo redirigimos a la página de login
          this.router.navigate(['/login']);
          return false; // Bloquea acceso a las rutas protegidas
        }

        // Si ya está autenticado y está intentando acceder a login o register, redirige a home-page
        const currentUrl = this.router.url;
        if (currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/password-recovery') {
          this.router.navigate(['/home-page']);
          return false; // Bloquea acceso a login/register si ya está autenticado
        }

        return true; // Permitir acceso a las rutas protegidas
      })
    );
  }
}
