import {IonicModule} from '@ionic/angular';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {QrPage} from './qr.page';
import {ExploreContainerComponentModule} from '../explore-container/explore-container.module';

import {QrPageRoutingModule} from './qr-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    QrPageRoutingModule,
  ],
  declarations: [QrPage],
})
export class QrPageModule {}
