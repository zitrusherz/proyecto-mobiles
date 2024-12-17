import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home-page/home-page.page').then((m) => m.HomePage),
        canActivate: [authGuard], // Protegido por authGuard
      },
      {
        path: 'qr',
        loadComponent: () =>
          import('../qr/qr.page').then((m) => m.QrPage),
        canActivate: [authGuard], // Protegido por authGuard
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
        canActivate: [authGuard], // Protegido por authGuard
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../login/login.page').then((m) => m.LoginPage),
    data: { public: true }, // Ruta pública
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../register/register.page').then((m) => m.RegisterPage),
    data: { public: true }, // Ruta pública
  },
  {
    path: 'password-recovery',
    loadComponent: () =>
      import('../password-recovery/password-recovery.page').then((m) => m.PasswordRecoveryPage),
    data: { public: true }, // Ruta pública
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/tabs/home', // Ruta comodín para manejar rutas no encontradas
  },
];
