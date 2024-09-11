import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('../app/pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('../app/pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'password-recovery',
    loadChildren: () => import('../app/pages/password-recovery/password-recovery.module').then( m => m.PasswordRecoveryPageModule)
  },
  
  {
    path: 'home-page',
    loadChildren: () => import('../app/pages/home-page/home-page.module').then( m => m.HomePagePageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('../app/pages/tabs/tabs.module').then( m => m.TabsPageModule)
  },
  {
    path: 'app',
    loadChildren: () => import('../app/app.module').then( m => m.AppModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
