import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {QrPage} from './qr.page';

const routes: Routes = [
  {
    path: '',
    component: QrPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QrPageRoutingModule {} // Renamed the class to "QrPageRoutingModule"
