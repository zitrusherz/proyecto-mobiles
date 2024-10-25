import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TabsPage} from './tabs.page';

const loginRoute = 'login';
const qrRoute = 'qr';
const tab3Route = 'tab3';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: loginRoute,
        loadChildren: () =>
          import('../login/login.module').then((m) => m.LoginPageModule),
      },
      {
        path: qrRoute,
        loadChildren: () =>
          import('../qr/qr.module').then((m) => m.QrPageModule),
      },
      {
        path: tab3Route,
        loadChildren: () =>
          import('../tab3/tab3.module').then((m) => m.Tab3PageModule),
      },
      {
        path: '',
        redirectTo: `/tabs/${loginRoute}`,
        pathMatch: 'prefix',
      },
    ],
  },
  {
    path: '',
    redirectTo: `/tabs/${loginRoute}`,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
