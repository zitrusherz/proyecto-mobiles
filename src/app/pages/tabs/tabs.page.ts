import { Component, OnInit } from '@angular/core';
import { AuthenticationStateService } from 'src/app/services/authentication-state.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnInit {
  isTab2Enabled: boolean = false;

  constructor(private authStateService: AuthenticationStateService) {}

  ngOnInit() {
    this.authStateService.isAuthenticated$.subscribe(isAuthenticated => {
      this.isTab2Enabled = isAuthenticated;
    });
  }
}
