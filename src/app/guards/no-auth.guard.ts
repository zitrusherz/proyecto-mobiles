import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthenticationStateService } from '../services/authentication-state.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private authStateService: AuthenticationStateService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authStateService.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log("se autentico");
          this.router.navigate(['/home-page']); // Redirige si está autenticado
          return false; // Bloquear acceso a rutas protegidas si está autenticado
        }
        return true; // Permitir acceso si no está autenticado
      })
    );
  }
}
