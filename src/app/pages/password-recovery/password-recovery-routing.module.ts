import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {PasswordRecoveryPage} from './password-recovery.page';

const routes: Routes = [
  {
    path: '',
    component: PasswordRecoveryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PasswordRecoveryPageRoutingModule {}
