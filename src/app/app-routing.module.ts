import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
    canActivate: [AuthGuard],
    data: { public: true },
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then(
        (m) => m.RegisterPageModule
      ),
    canActivate: [AuthGuard],
    data: { public: true },
  },
  {
    path: 'password-recovery',
    loadChildren: () =>
      import('./pages/password-recovery/password-recovery.module').then(
        (m) => m.PasswordRecoveryPageModule
      ),
    canActivate: [AuthGuard],
    data: { public: true },
  },
  {
    path: 'home-page',
    loadChildren: () =>
      import('./pages/home-page/home-page.module').then(
        (m) => m.HomePagePageModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/tabs/tabs.module').then((m) => m.TabsPageModule),

  },

  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
