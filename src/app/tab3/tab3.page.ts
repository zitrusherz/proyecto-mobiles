import { Component } from '@angular/core';
import { IonicCommonComponents } from '../components/ionic-common-components';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicCommonComponents, ExploreContainerComponent],
})
export class Tab3Page {
  constructor() {}
}
