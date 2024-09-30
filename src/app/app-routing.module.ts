import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; 

const routes: Routes = [
  {
    path: '', 
    loadChildren: () => import('../app/pages/login/login.module').then(m => m.LoginPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'register',
    loadChildren: () => import('../app/pages/register/register.module').then(m => m.RegisterPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'password-recovery',
    loadChildren: () => import('../app/pages/password-recovery/password-recovery.module').then(m => m.PasswordRecoveryPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'home-page',
    loadChildren: () => import('../app/pages/home-page/home-page.module').then(m => m.HomePagePageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'tabs',
    loadChildren: () => import('../app/pages/tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: '**', 
    redirectTo: '' 
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
